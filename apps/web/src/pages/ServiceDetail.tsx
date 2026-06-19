import { useParams } from "react-router-dom";
import ServiceDetailContent from "../components/services/ServiceDetailContent";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  return <ServiceDetailContent serviceId={id} backHref="/services" />;
}
