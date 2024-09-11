import Form from '../../../../ui/invoices/edit-form'
import Breadcrumbs from "../../../../ui/invoices/breadcrumbs"
import {fetchCustomers, fetchInvoiceById} from "../../../../lib/data"


export default async function Page({params}: { params: { id: string } }) {
    const id = params.id
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers(),
    ])
    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    {label: '发票', href: '/dashboard/invoices'},
                    {
                        label: '编辑发票',
                        href: `/dashboard/invoices/${id}/edit`,
                        active: true,
                    },
                ]}
            />
            <Form invoice={invoice} customers={customers}/>
        </main>
    )
}