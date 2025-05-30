'use client'

import {useForm} from 'react-hook-form'
import {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormField,
} from '@/components/ui/form' // Adjust path as per your project
import {Input} from '@/components/ui/input' // Assuming you have a styled input component
import {Button} from '@/components/ui/button' // Assuming you have a styled button component
import {useLogin} from "@/context/LoginContext";

type LoginValues = {
    username: string
    password: string
}

export function LoginForm() {
    const {login} = useLogin();
    const form = useForm<LoginValues>({
        defaultValues: {
            username: '',
            password: '',
        },
    })

    const onSubmit = (values: LoginValues) => {
        login(values.username, values.password)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="username"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Enter password" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full">
                    Login
                </Button>
            </form>
        </Form>
    )
}
