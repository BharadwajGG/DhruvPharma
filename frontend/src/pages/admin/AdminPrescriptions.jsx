import AdminLayout from '../../components/AdminLayout'
import PrescriptionQueueView from '../../components/PrescriptionQueueView'

export default function AdminPrescriptions() {
    return (
        <AdminLayout>
            <PrescriptionQueueView
                title="Prescription Review Queue"
                subtitle="Review and process customer uploaded prescriptions for delivery"
            />
        </AdminLayout>
    )
}
