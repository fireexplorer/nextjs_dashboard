// 此文件包含数据的类型定义。
// 它描述了数据的形状，以及每个属性应该接受的数据类型。
// 为了简化教学，我们手动定义这些类型。
// 但是，如果您使用的是 Prisma 等 ORM，则这些类型是自动生成的。
export type User = {
    id: string
    name: string
    email: string
    password: string
}

export type Customer = {
    id: string
    name: string
    email: string
    image_url: string
}

export type Invoice = {
    id: string
    customer_id: string
    amount: number
    date: string
    // In TypeScript, this is called a string union type.
    // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
    status: 'pending' | 'paid'
}

export type Revenue = {
    month: string
    revenue: number
}

export type LatestInvoice = {
    id: string
    name: string
    image_url: string
    email: string
    amount: string
}

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
    amount: number
}

export type InvoicesTable = {
    id: string
    customer_id: string
    name: string
    email: string
    image_url: string
    date: string
    amount: number
    status: 'pending' | 'paid'
}

export type CustomersTableType = {
    id: string
    name: string
    email: string
    image_url: string
    total_invoices: number
    total_pending: number
    total_paid: number
}

export type FormattedCustomersTable = {
    id: string
    name: string
    email: string
    image_url: string
    total_invoices: number
    total_pending: string
    total_paid: string
}

export type CustomerField = {
    id: string
    name: string
}

export type InvoiceForm = {
    id: string
    customer_id: string
    amount: number
    status: 'pending' | 'paid'
}
