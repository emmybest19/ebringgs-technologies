import { useParams } from "react-router-dom";
import ServiceDetailContent from "../../components/services/ServiceDetailContent";

export default function ClientServiceDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <ServiceDetailContent
      serviceId={id}
      backHref="/client/services"
      backLabel="Back to services"
      embedded
    />
  );
}
