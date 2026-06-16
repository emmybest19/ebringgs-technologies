import { useParams } from 'react-router-dom';
import TutoringDetailContent from '../../components/tutoring/TutoringDetailContent';

export default function StudentServiceDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <TutoringDetailContent
      trackId={id}
      backHref="/dashboard/services"
      backLabel="Back to tutoring"
      embedded
    />
  );
}
