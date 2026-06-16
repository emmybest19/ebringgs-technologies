import { useParams } from 'react-router-dom';
import ServiceDetailContent from '../../components/services/ServiceDetailContent';

export default function StudentServiceDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <ServiceDetailContent
      serviceId={id}
      backHref="/dashboard/services"
      backLabel="Back to services"
      embedded
    />
  );
}
