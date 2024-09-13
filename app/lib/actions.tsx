'use server'
import {z} from 'zod'
import {sql} from '@vercel/postgres'
import {revalidatePath} from "next/cache"
import {redirect} from "next/navigation"
import {signIn} from "../../auth"
import {AuthError} from "next-auth"


const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({invalid_type_error: '请选择一个客户。',}),
    amount: z.coerce.number().gt(0, {message: '请输入大于 0 的数字。'}),
    status: z.enum(['pending', 'paid'], {invalid_type_error: '请选择发票状态。'}),
    date: z.string(),
})

const CreateInvoice = FormSchema.omit({id: true, date: true})

const UpdateInvoice = FormSchema.omit({id: true, date: true})

export type State = {
    errors?: {
        customerId?: string[]
        amount?: string[]
        status?: string[]
    },
    message?: string | null
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn('credentials', formData)
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return '凭证无效。'
                default:
                    return '出了点问题。'
            }
        }
        throw error
    }
}

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: '字段缺失；创建发票失败。'
        }
    }
    const {customerId, amount, status} = validatedFields.data
    const amountInCents = amount * 100
    const date = new Date().toISOString().split('T')[0]
    try {
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `
    } catch (error) {
        return {message: '数据库错误：无法创建发票。'}
    }
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

export async function updateInvoice(id: string, formData: FormData) {
    const {customerId, amount, status} = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })
    const amountInCents = amount * 100
    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId},
                amount      = ${amountInCents},
                status      = ${status}
            WHERE id = ${id}
        `
    } catch (error) {
        return {message: '数据库错误：无法更新发票。'}
    }
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
    try {
        await sql`
            DELETE
            FROM invoices
            WHERE id = ${id}`
        revalidatePath('/dashboard/invoices')
        return {message: '已删除发票。'}
    } catch (error) {
        return {message: '数据库错误：无法删除发票。'}
    }
}