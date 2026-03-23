import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

// API functions
const fetchClientDetails = async (id) => {
  const clientDoc = await getDoc(doc(db, 'clients', id));
  if (!clientDoc.exists()) throw new Error('Client not found');
  return { id: clientDoc.id, ...clientDoc.data() };
};

const fetchClientCases = async (clientId) => {
  const q = query(
    collection(db, 'masterCases'), 
    where('clientId', '==', clientId),
    orderBy('nextDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const ClientDetail = () => {
  const { id } = useParams();

  const { data: client, isLoading: clientLoading, isError: clientError } = useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClientDetails(id),
  });

  const { data: cases, isLoading: casesLoading, isError: casesError } = useQuery({
    queryKey: ['cases', 'byClient', id],
    queryFn: () => fetchClientCases(id),
  });

  if (clientLoading || casesLoading) return <div className="text-center p-4">Loading...</div>;
  if (clientError) return <div className="text-center p-4 text-red-500">Error loading client details.</div>;
  if (casesError) return <div className="text-center p-4 text-red-500">Error loading cases.</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800">{client.name}</h1>
        <p className="text-gray-600 mt-2">Email: {client.email} | Phone: {client.phone}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Matters (Cases)</h2>
          <Link 
            to="/cases/add"
            state={{ clientId: id }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Case
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Case Name</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Next Date</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Court</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Status</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem) => (
                <tr key={caseItem.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{caseItem.caseName}</td>
                  <td className="py-3 px-4">{caseItem.nextDate}</td>
                  <td className="py-3 px-4">{caseItem.court}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${caseItem.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                      {caseItem.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to={`/cases/edit/${caseItem.id}`} className="text-blue-500 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4">No cases found for this client.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
