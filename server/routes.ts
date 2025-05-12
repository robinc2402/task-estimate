import e, {Express, Request, Response} from "express";
import {createServer, type Server} from "http";
import {WebSocketServer} from "ws";
import {storage} from "./storage";
import {
    taskPredictionSchema,
    taskFeedbackSchema,
    taskVoteSchema,
    taskFinalizeSchema,
    sessionSchema,
    taskImportSchema,
    TShirtSize,
    pointsMapping,
    type InsertTask,
    type TaskImport,
    type TaskVote,
    type InsertSession
} from "@shared/schema";
import {ZodError} from "zod";
import {parse} from "csv-parse/sync";

// Simple ML model to predict task size based on features
function predictTaskSize(title: string, description: string) {
    // Combine title and description for feature extraction
    const text = `${title} ${description}`.toLowerCase();

    // Count words as a simple complexity metric
    const wordCount = text.split(/\s+/).length;

    // Look for complexity keywords
    const complexityKeywords = [
        'complex', 'difficult', 'challenging', 'intricate',
        'refactor', 'architecture', 'redesign', 'optimize', 'security',
        'implement', 'create', 'build', 'develop', 'integration',
        'database', 'api', 'performance', 'authentication', 'authorization'
    ];

    // Count complexity indicators
    let complexityScore = 0;
    complexityKeywords.forEach(keyword => {
        if (text.includes(keyword)) complexityScore++;
    });

    // Adjust based on description length (longer descriptions often indicate more complexity)
    let lengthFactor = Math.min(Math.floor(wordCount / 20), 3);

    // Combined score
    const totalScore = complexityScore + lengthFactor;

    // Determine T-shirt size based on score
    let size: keyof typeof TShirtSize;
    let confidence: number;

    if (totalScore <= 1) {
        size = 'XS';
        confidence = 70 + Math.floor(Math.random() * 15);
    } else if (totalScore <= 3) {
        size = 'S';
        confidence = 75 + Math.floor(Math.random() * 15);
    } else if (totalScore <= 5) {
        size = 'M';
        confidence = 80 + Math.floor(Math.random() * 15);
    } else if (totalScore <= 7) {
        size = 'L';
        confidence = 75 + Math.floor(Math.random() * 20);
    } else if (totalScore <= 9) {
        size = 'XL';
        confidence = 70 + Math.floor(Math.random() * 20);
    } else {
        size = 'XXL';
        confidence = 65 + Math.floor(Math.random() * 25);
    }

    // Find similar tasks from history
    return {
        size,
        points: pointsMapping[size],
        confidence
    };
}

// Find similar tasks based on keywords
async function findSimilarTasks(title: string, description: string, predictedSize: keyof typeof TShirtSize) {
    const text = `${title} ${description}`.toLowerCase();
    const allTasks = await storage.getAllTasks();

    // Simple similarity algorithm
    return allTasks
        .map(task => {
            const taskText = `${task.title} ${task.description}`.toLowerCase();

            // Calculate word overlap as simple similarity metric
            const textWords = new Set(text.split(/\s+/));
            const taskWords = new Set(taskText.split(/\s+/));
            const overlap = [...textWords].filter(word => taskWords.has(word)).length;

            return {
                task,
                similarity: overlap
            };
        })
        .filter(item => item.similarity > 1) // Filter for minimum similarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3) // Get top 3 similar tasks
        .map(item => ({
            id: item.task.id,
            title: item.task.title,
            size: item.task.size,
            points: item.task.points
        }));
}

// Parse CSV data into task objects
function parseCSV(csvData: string): TaskImport[] {
    try {
        // Parse the CSV data
        const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Validate and transform records
        return records.map((record: any) => {
            return taskImportSchema.parse({
                title: record.title || record.Title || '',
                description: record.description || record.Description || ''
            });
        });
    } catch (error) {
        console.error('Error parsing CSV:', error);
        throw new Error('Invalid CSV format');
    }
}

export async function registerRoutes(app: Express): Promise<Server> {
    // API endpoint to predict task size
    app.post('/api/tasks/predict', async (req: Request, res: Response) => {
        try {
            // Validate request body
            const validatedData = taskPredictionSchema.parse(req.body);
            const {title, description} = validatedData;

            // Predict task size
            const prediction = predictTaskSize(title, description);

            // Find similar tasks
            const similarTasks = await findSimilarTasks(title, description, prediction.size);

            res.json({
                title,
                description,
                size: prediction.size,
                points: prediction.points,
                confidence: prediction.confidence,
                similarTasks
            });
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({message: error.errors});
            } else {
                res.status(500).json({message: 'Failed to predict task size'});
            }
        }
    });

    // API endpoint to save task
    app.post('/api/tasks', async (req: Request, res: Response) => {
        try {
            const taskData: InsertTask = {
                title: req.body.title,
                description: req.body.description,
                size: req.body.size,
                points: req.body.points,
                confidence: req.body.confidence,
                similarTasks: req.body.similarTasks || [],
                feedback: null
            };

            const task = await storage.createTask(taskData);
            res.status(201).json(task);
        } catch (error) {
            res.status(500).json({message: 'Failed to save task'});
        }
    });

    // API endpoint to get recent tasks
    app.get('/api/tasks/recent', async (_req: Request, res: Response) => {
        try {
            const tasks = await storage.getRecentTasks(10);
            res.json(tasks);
        } catch (error) {
            res.status(500).json({message: 'Failed to get recent tasks'});
        }
    });

    // API endpoint to get stats
    app.get('/api/stats', async (_req: Request, res: Response) => {
        try {
            const stats = await storage.getTaskStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({message: 'Failed to get stats'});
        }
    });

    // API endpoint to provide feedback on a task
    app.post('/api/tasks/:id/feedback', async (req: Request, res: Response) => {
        try {
            const {id} = req.params;
            const {actualSize} = taskFeedbackSchema.parse({
                id: parseInt(id),
                actualSize: req.body.actualSize
            });

            const feedback = `Predicted: ${req.body.predictedSize}, Actual: ${actualSize}`;
            const task = await storage.updateTaskFeedback(parseInt(id), feedback);

            if (!task) {
                return res.status(404).json({message: 'Task not found'});
            }

            res.json(task);
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({message: error.errors});
            } else {
                res.status(500).json({message: 'Failed to update task feedback'});
            }
        }
    });

    // API endpoint to update a task's size (for recent tasks editing)
    app.put('/api/tasks/:id/size', async (req: Request, res: Response) => {
        try {
            const {id} = req.params;
            const {size} = req.body;

            if (!Object.values(TShirtSize).includes(size)) {
                return res.status(400).json({message: 'Invalid size'});
            }

            const task = await storage.updateTaskSize(parseInt(id), size);

            if (!task) {
                return res.status(404).json({message: 'Task not found'});
            }

            res.json(task);
        } catch (error) {
            res.status(500).json({message: 'Failed to update task size'});
        }
    });

    // --- New Endpoints for Collaborative Estimation ---

    // Create a new estimation session
    app.post('/api/sessions', async (req: Request, res: Response) => {
        try {
            const sessionData = sessionSchema.parse(req.body);
            const session = await storage.createSession(sessionData);
            res.status(201).json(session);
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({message: error.errors});
            } else {
                res.status(500).json({message: 'Failed to create session'});
            }
        }
    });

    // Get active sessions
    app.get('/api/sessions', async (_req: Request, res: Response) => {
        try {
            const sessions = await storage.getActiveSessions();
            res.json(sessions);
        } catch (error) {
            res.status(500).json({message: 'Failed to get sessions'});
        }
    });

    // Get tasks for a specific session
    app.get('/api/sessions/:id/tasks', async (req: Request, res: Response) => {
        try {
            const {id} = req.params;
            const tasks = await storage.getSessionTasks(id);
            res.json(tasks);
        } catch (error) {
            res.status(500).json({message: 'Failed to get session tasks'});
        }
    });

    // Import tasks from CSV for a session
    app.post('/api/sessions/:id/import', async (req: Request, res: Response) => {
        try {
            const {id} = req.params;
            const {csvData} = req.body;

            if (!csvData) {
                return res.status(400).json({message: 'CSV data is required'});
            }

            // Parse CSV to array of task objects
            const taskImports = parseCSV(csvData);

            // Generate predictions for each task
            const insertTasks: InsertTask[] = await Promise.all(
                taskImports.map(async (taskImport) => {
                    const {title, description} = taskImport;
                    const prediction = predictTaskSize(title, description);
                    const similarTasks = await findSimilarTasks(title, description, prediction.size);

                    return {
                        title,
                        description,
                        size: prediction.size,
                        points: prediction.points,
                        confidence: prediction.confidence,
                        similarTasks,
                        feedback: null
                    };
                })
            );

            // Create the tasks in bulk
            const tasks = await storage.createBulkTasks(insertTasks, id);
            res.status(201).json(tasks);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({message: error.message});
            } else {
                res.status(500).json({message: 'Failed to import tasks'});
            }
        }
    });

    // Vote on a task size
    app.post('/api/tasks/:id/vote', async (req: Request, res: Response) => {
        try {
            const {id} = req.params;
            const vote: TaskVote = taskVoteSchema.parse({
                taskId: id,
                userId: req.body.userId,
                userName: req.body.userName,
                size: req.body.size
            });

            const task = await storage.addTaskVote(vote);

            if (!task) {
                return res.status(404).json({message: 'Task not found'});
            }

            res.json(task);
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({message: error.errors});
            } else {
                res.status(500).json({message: 'Failed to vote on task'});
            }
        }
    });

    // Finalize a task with agreed size
    app.post('/api/tasks/:id/finalize', async (req: Request, res: Response) => {
        try {
            const {id} = req.params;
            const {finalSize} = taskFinalizeSchema.parse({
                taskId: id,
                finalSize: req.body.finalSize
            });

            const task = await storage.finalizeTask(id, finalSize);

            if (!task) {
                return res.status(404).json({message: 'Task not found'});
            }

            res.json(task);
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({message: error.errors});
            } else {
                res.status(500).json({message: 'Failed to finalize task'});
            }
        }
    });

    app.post('/api/login', async (req: Request, res: Response) => {
        try {
            const {username, password} = req.body;
            const user = await storage.getUserByUsername(username);
            if (await verifyPassword({userpass: user?.password || "", password})) {
                res.json({user})
            } else {
                throw new Error('Invalid user');
            }
        } catch (error) {
            res.status(500).json({message: `Login failed ${error}`});
        }

    })
    app.get('/api/team-members', async (req: Request, res: Response) => {
        try {
            const users = await storage.getUsers();
            res.json({users});
        } catch (error) {
            res.status(500).json({message: `Login failed ${error}`});
        }

    })

    // Create HTTP server
    const httpServer = createServer(app);

    // Add WebSocket server for real-time updates
    const wss = new WebSocketServer({server: httpServer, path: '/ws'});

    wss.on('connection', (ws) => {
        console.log('WebSocket client connected');

        // Send initial message
        ws.send(JSON.stringify({type: 'connection', message: 'Connected to estimation server'}));

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log('Received message:', data);

                // Broadcast message to all clients
                wss.clients.forEach((client) => {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify({
                            type: 'update',
                            data
                        }));
                    }
                });
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        });

        ws.on('close', () => {
            console.log('WebSocket client disconnected');
        });
    });

    return httpServer;
}

async function verifyPassword({userpass, password}: { userpass: string, password: string }) {
    return userpass === password;
}