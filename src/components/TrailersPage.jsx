import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, Modal, Pill, StatusDot } from './index';
import { pageTransition, toast } from '../utils';

export function TrailersPage({ trailers, setTrailers }) {
  const [modal, setModal] = useState({ open: false, mode: 'add', trailer: null });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyTrailer = { id: '', type: 'Dry Van', owner: 'US TEAM', status: 'On Road', extId: '', notes: '' };

  const handleAdd = () => {
    setModal({ open: true, mode: 'add', trailer: emptyTrailer });
  };

  const handleEdit = (trailer) => {
    setModal({ open: true, mode: 'edit', trailer });
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const handleSave = (trailer) => {
    if (modal.mode === 'add') {
      setTrailers([...trailers, { ...trailer, id: 'TR-' + Math.random().toString(36).slice(2, 7).toUpperCase() }]);
      toast.success('Trailer added successfully');
    } else {
      setTrailers(trailers.map(t => t.id === trailer.id ? trailer : t));
      toast.success('Trailer updated successfully');
    }
    setModal({ open: false, mode: 'add', trailer: null });
  };

  const confirmDeleteTrailer = (id) => {
    setTrailers(trailers.filter(t => t.id !== id));
    setConfirmDelete(null);
    toast.success('Trailer deleted successfully');
  };

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <Card
        title="Trailers Management"
        toolbar={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{trailers.length} trailers</Pill>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-sm font-semibold transition-all duration-200"
            >
              <Plus size={16} /> Add Trailer
            </motion.button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Owner</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">External ID</th>
                <th className="pb-2 pr-4">Notes</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {trailers.map((trailer, i) => (
                <motion.tr 
                  key={trailer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150"
                >
                  <td className="py-3 pr-4 font-medium">{trailer.id}</td>
                  <td className="py-3 pr-4">{trailer.type}</td>
                  <td className="py-3 pr-4">{trailer.owner}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <StatusDot status={trailer.status}/> {trailer.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{trailer.extId}</td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{trailer.notes}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      <motion.button 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }} 
                        onClick={() => toast.success(`Viewing ${trailer.id}`)}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-700 rounded transition-colors duration-150 text-blue-600"
                      >
                        <Eye size={14} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }} 
                        onClick={() => handleEdit(trailer)}
                        className="p-1 hover:bg-green-100 dark:hover:bg-green-700 rounded transition-colors duration-150 text-green-600"
                      >
                        <Edit size={14} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }} 
                        onClick={() => handleDelete(trailer.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-150 text-red-600"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {modal.open && (
          <Modal onClose={() => setModal({ open: false, mode: 'add', trailer: null })}>
            <div className="p-6 space-y-4">
              <div className="text-lg font-semibold mb-2">{modal.mode === 'add' ? 'Add Trailer' : 'Edit Trailer'}</div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleSave({
                  ...modal.trailer,
                  type: formData.get('type'),
                  owner: formData.get('owner'),
                  status: formData.get('status'),
                  extId: formData.get('extId'),
                  notes: formData.get('notes')
                });
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <select name="type" defaultValue={modal.trailer.type} className="col-span-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800">
                    <option value="Dry Van">Dry Van</option>
                    <option value="Refrigerated">Refrigerated</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Tank">Tank</option>
                  </select>
                  <input name="owner" defaultValue={modal.trailer.owner} placeholder="Owner" required className="col-span-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800" />
                  <select name="status" defaultValue={modal.trailer.status} className="col-span-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800">
                    <option value="On Road">On Road</option>
                    <option value="Yard">Yard</option>
                    <option value="Service">Service</option>
                    <option value="Repair">Repair</option>
                  </select>
                  <input name="extId" defaultValue={modal.trailer.extId} placeholder="External ID" className="col-span-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800" />
                  <input name="notes" defaultValue={modal.trailer.notes} placeholder="Notes" className="col-span-2 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800" />
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setModal({ open: false, mode: 'add', trailer: null })}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {modal.mode === 'add' ? 'Add' : 'Save'}
                  </motion.button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {confirmDelete && (
          <Modal onClose={() => setConfirmDelete(null)}>
            <div className="p-6 text-center">
              <div className="mb-4 text-lg">Delete this trailer?</div>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => confirmDeleteTrailer(confirmDelete)}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </Card>
    </motion.div>
  );
}

