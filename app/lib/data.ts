import {sql} from '@vercel/postgres'
import {CustomerField, CustomersTableType, InvoiceForm, InvoicesTable, LatestInvoiceRaw, Revenue,} from './definitions'
import {formatCurrency} from './utils'


export async function fetchRevenue() {
    try {
        // 出于演示目的人为延迟响应。
        // 不要在生产中执行此操作
        console.log('正在获取收入数据...')
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const data = await sql<Revenue>`
            SELECT *
            FROM revenue
        `
        console.log('数据获取在 3 秒后完成。')
        return data.rows
    } catch (error) {
        console.error('Database Error:', error)
        throw new Error('无法获取收入数据。')
    }
}

export async function fetchLatestInvoices() {
    try {
        const data = await sql<LatestInvoiceRaw>`
            SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
            FROM invoices
                     JOIN customers ON invoices.customer_id = customers.id
            ORDER BY invoices.date DESC LIMIT 5`

        return data.rows.map((invoice) => ({
            ...invoice,
            amount: formatCurrency(invoice.amount),
        }))
    } catch (error) {
        console.error('Database Error:', error)
        throw new Error('无法获取最新的发票。')
    }
}

export async function fetchCardData() {
    try {
        // 您可以将这些组合到单个 SQL 查询中
        // 但是，我们故意将它们分开以示威如何使用 JS 并行初始化多个查询。
        const invoiceCountPromise = sql`SELECT COUNT(*)
                                        FROM invoices`
        const customerCountPromise = sql`SELECT COUNT(*)
                                         FROM customers`
        const invoiceStatusPromise = sql`
            SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)    AS "paid",
                   SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
            FROM invoices
        `

        const data = await Promise.all([
            invoiceCountPromise,
            customerCountPromise,
            invoiceStatusPromise,
        ])

        const numberOfInvoices = Number(data[0].rows[0].count ?? '0')
        const numberOfCustomers = Number(data[1].rows[0].count ?? '0')
        const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0')
        const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0')

        return {
            numberOfCustomers,
            numberOfInvoices,
            totalPaidInvoices,
            totalPendingInvoices,
        }
    } catch (error) {
        console.error('Database Error:', error)
        throw new Error('无法获取卡数据。')
    }
}

const ITEMS_PER_PAGE = 6

export async function fetchFilteredInvoices(
    query: string,
    currentPage: number,
) {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE
    try {
        const invoices = await sql<InvoicesTable>`
            SELECT invoices.id,
                   invoices.amount,
                   invoices.date,
                   invoices.status,
                   customers.name,
                   customers.email,
                   customers.image_url
            FROM invoices
                     JOIN customers ON invoices.customer_id = customers.id
            WHERE customers.name ILIKE ${`%${query}%`}
               OR customers.email ILIKE ${`%${query}%`}
               OR invoices.amount::text ILIKE ${`%${query}%`}
               OR invoices.date::text ILIKE ${`%${query}%`}
               OR invoices.status ILIKE ${`%${query}%`}
            ORDER BY invoices.date DESC LIMIT ${ITEMS_PER_PAGE}
            OFFSET ${offset}
        `
        return invoices.rows
    } catch (error) {
        console.error('Database Error:', error)
        throw new Error('无法获取发票。')
    }
}

export async function fetchInvoicesPages(query: string) {
    try {
        const count = await sql`
            SELECT COUNT(*)
            FROM invoices
                     JOIN customers ON invoices.customer_id = customers.id
            WHERE customers.name ILIKE ${`%${query}%`}
               OR customers.email ILIKE ${`%${query}%`}
               OR invoices.amount::text ILIKE ${`%${query}%`}
               OR invoices.date::text ILIKE ${`%${query}%`}
               OR invoices.status ILIKE ${`%${query}%`}
        `
        return Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE)
    } catch (error) {
        console.error('Database Error:', error)
        throw new Error('无法获取发票总数。')
    }
}

export async function fetchInvoiceById(id: string) {
    try {
        const data = await sql<InvoiceForm>`
            SELECT invoices.id,
                   invoices.customer_id,
                   invoices.amount,
                   invoices.status
            FROM invoices
            WHERE invoices.id = ${id};
        `
        const invoice = data.rows.map((invoice) => ({
            ...invoice,
            // 转换 金额 从 美分 到 美元
            amount: invoice.amount / 100,
        }))
        return invoice[0]
    } catch (error) {
        console.error('Database Error:', error)
        throw new Error('无法获取发票。')
    }
}

export async function fetchCustomers() {
    try {
        const data = await sql<CustomerField>`
            SELECT id, name
            FROM customers
            ORDER BY name ASC
        `
        return data.rows
    } catch (err) {
        console.error('Database Error:', err)
        throw new Error('无法获取所有客户。')
    }
}

export async function fetchFilteredCustomers(query: string) {
    try {
        const data = await sql<CustomersTableType>`
            SELECT customers.id,
                   customers.name,
                   customers.email,
                   customers.image_url,
                   COUNT(invoices.id)                                                         AS total_invoices,
                   SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
                   SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END)    AS total_paid
            FROM customers
                     LEFT JOIN invoices ON customers.id = invoices.customer_id
            WHERE customers.name ILIKE ${`%${query}%`}
               OR customers.email ILIKE ${`%${query}%`}
            GROUP BY customers.id, customers.name, customers.email, customers.image_url
            ORDER BY customers.name ASC
        `
        return data.rows.map((customer) => ({
            ...customer,
            total_pending: formatCurrency(customer.total_pending),
            total_paid: formatCurrency(customer.total_paid),
        }))
    } catch (err) {
        console.error('Database Error:', err)
        throw new Error('无法获取 customer 表。')
    }
}
