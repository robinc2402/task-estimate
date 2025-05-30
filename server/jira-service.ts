
import axios from 'axios';
import { TaskImport } from '@shared/schema';

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description?: {
      content?: Array<{
        content?: Array<{
          text?: string;
        }>;
      }>;
    } | string;
    issuetype: {
      name: string;
    };
    status: {
      name: string;
    };
  };
}

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export class JiraService {
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
  }

  private getAuthHeader(): string {
    const auth = Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64');
    return `Basic ${auth}`;
  }

  private extractDescription(description: any): string {
    if (!description) return '';
    
    if (typeof description === 'string') {
      return description;
    }

    // Handle Atlassian Document Format (ADF)
    if (description.content && Array.isArray(description.content)) {
      return description.content
        .map((block: any) => {
          if (block.content && Array.isArray(block.content)) {
            return block.content
              .map((item: any) => item.text || '')
              .join(' ');
          }
          return '';
        })
        .join('\n')
        .trim();
    }

    return '';
  }

  async fetchIssuesFromProject(projectKey: string, maxResults: number = 50): Promise<TaskImport[]> {
    try {
      const jql = `project = "${projectKey}" AND status != Done ORDER BY created DESC`;
      
      const response = await axios.get(`${this.config.baseUrl}/rest/api/3/search`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: {
          jql,
          maxResults,
          fields: 'summary,description,issuetype,status'
        }
      });

      const issues: JiraIssue[] = response.data.issues;

      return issues.map(issue => ({
        title: `[${issue.key}] ${issue.fields.summary}`,
        description: this.extractDescription(issue.fields.description)
      }));

    } catch (error) {
      console.error('Error fetching Jira issues:', error);
      throw new Error(`Failed to fetch issues from Jira project ${projectKey}`);
    }
  }

  async fetchIssuesFromJQL(jql: string, maxResults: number = 50): Promise<TaskImport[]> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/rest/api/3/search`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: {
          jql,
          maxResults,
          fields: 'summary,description,issuetype,status'
        }
      });

      const issues: JiraIssue[] = response.data.issues;

      return issues.map(issue => ({
        title: `[${issue.key}] ${issue.fields.summary}`,
        description: this.extractDescription(issue.fields.description)
      }));

    } catch (error) {
      console.error('Error fetching Jira issues:', error);
      throw new Error('Failed to fetch issues from Jira using JQL');
    }
  }

  async getProjects(): Promise<Array<{key: string, name: string}>> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/rest/api/3/project`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json'
        }
      });

      return response.data.map((project: any) => ({
        key: project.key,
        name: project.name
      }));

    } catch (error) {
      console.error('Error fetching Jira projects:', error);
      throw new Error('Failed to fetch Jira projects');
    }
  }
}
