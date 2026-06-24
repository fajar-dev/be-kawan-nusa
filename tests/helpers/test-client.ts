import { createApp } from "../../src/app"

const app = createApp()

interface RequestOptions {
    method?: string
    headers?: Record<string, string>
    body?: any
}

export async function request(path: string, options: RequestOptions = {}) {
    const { method = 'GET', headers = {}, body } = options
    
    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    }
    
    if (body && method !== 'GET') {
        init.body = JSON.stringify(body)
    }
    
    const res = await app.request(`/api${path}`, init)
    const json = await res.json().catch(() => null)
    
    return {
        status: res.status,
        body: json,
        headers: res.headers,
    }
}

export async function authRequest(path: string, token: string, options: RequestOptions = {}) {
    return request(path, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    })
}

export async function formRequest(path: string, formData: FormData, options: Omit<RequestOptions, 'body'> = {}) {
    const { method = 'POST', headers = {} } = options

    const res = await app.request(`/api${path}`, {
        method,
        headers: { ...headers },
        body: formData,
    })
    const json = await res.json().catch(() => null)

    return {
        status: res.status,
        body: json,
        headers: res.headers,
    }
}

export { app }
