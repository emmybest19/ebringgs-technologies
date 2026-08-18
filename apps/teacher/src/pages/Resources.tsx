import { BookOpen } from 'lucide-react';
import { useSEO } from '@ebringgs/ui';

export default function TeacherResources() {
  useSEO({ title: 'Resources', siteName: 'E-Bringgs Teacher Portal' });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Resources</h1>
      <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
        <BookOpen size={40} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
        <p className="font-medium text-gray-500 dark:text-slate-400">No resources uploaded yet</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
          Upload PDFs, slides, and links for your students.
        </p>
      </div>
    </div>
  );
}
