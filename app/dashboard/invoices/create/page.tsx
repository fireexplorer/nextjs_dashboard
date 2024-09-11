import Form from "../../../ui/invoices/create-form"
import Breadcrumbs from "../../../ui/invoices/breadcrumbs"
import {fetchCustomers} from "../../../lib/data"


export default async function Page() {
    const customers = await fetchCustomers()
    return (
        <main>
            <Breadcrumbs breadcrumbs={[
                {label: '发票', href: '/dashboard/invoices'},
                {label: '新增发票', href: '/dashboard/invoices/create', active: true,},
            ]}/>
            <Form customers={customers}/>
        </main>
    )
}