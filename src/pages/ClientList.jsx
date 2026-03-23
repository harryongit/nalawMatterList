import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';

// API functions
const fetchClients = async () => {
  const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const deleteClient = async (id) => {
  await deleteDoc(doc(db, 'clients', id));
};

const ClientList = () => {
  const queryClient = useQueryClient();

  const { data: clients, isLoading, isError, error } = useQuery({ 
    queryKey: ['clients'], 
    queryFn: fetchClients 
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="text-center p-4">Loading...</div>;
  if (isError) return <div className="text-center p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Clients</h1>
        <Link 
          to="/clients/add" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Client
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Name</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Email</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Phone</th>
              <th className="py-3 px-4 text-right text-gray-600 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{client.name}</td>
                <td className="py-3 px-4">{client.email}</td>
                <td className="py-3 px-4">{client.phone}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <Link to={`/clients/${client.id}`} className="text-blue-500 hover:underline">View</Link>
                    <Link to={`/clients/edit/${client.id}`} className="text-green-500 hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(client.id)} className="text-red-500 hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientList;
