import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';

// API function
const fetchCaseLogs = async (caseId) => {
  if (!caseId) return [];
  const q = query(
    collection(db, 'caseLogs'), 
    where('caseId', '==', caseId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const CaseLogDialog = ({ open, onClose, caseItem }) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['caseLogs', caseItem?.id],
    queryFn: () => fetchCaseLogs(caseItem?.id),
    enabled: open && !!caseItem?.id, // Only fetch when dialog is open and a case is selected
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full m-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Logs for: {caseItem?.caseName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <p>Loading logs...</p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 text-left">Action</th>
                  <th className="py-2 px-3 text-left">Date Info</th>
                  <th className="py-2 px-3 text-left">Logged At</th>
                </tr>
              </thead>
              <tbody>
                {logs?.map(log => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{log.action}</td>
                    <td className="py-2 px-3">{log.date || '-'}</td>
                    <td className="py-2 px-3">
                      {log.createdAt ? format(log.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'}
                    </td>
                  </tr>
                ))}
                {logs?.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-4">No logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseLogDialog;
