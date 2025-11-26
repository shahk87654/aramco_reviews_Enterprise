'use client';

import { useState } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Copy, Trash2, Eye, Save } from 'lucide-react';

interface FormField {
  id: string;
  type: 'rating' | 'category-rating' | 'text' | 'textarea' | 'upload' | 'dropdown';
  label: string;
  required: boolean;
  options?: string[];
}

export default function FormBuilderPage({ params }: { params: { id: string } }) {
  const [fields, setFields] = useState<FormField[]>([
    { id: '1', type: 'rating', label: 'Overall Experience', required: true },
    { id: '2', type: 'category-rating', label: 'Categories', required: true },
    { id: '3', type: 'textarea', label: 'Additional Feedback', required: false },
    { id: '4', type: 'upload', label: 'Photos', required: false },
  ]);

  const [showPreview, setShowPreview] = useState(false);
  const [stationName] = useState('Downtown Central (ASS-001)');

  const componentOptions = [
    { type: 'rating', label: 'Star Rating', icon: '⭐' },
    { type: 'category-rating', label: 'Category Ratings', icon: '📊' },
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'textarea', label: 'Large Text', icon: '📄' },
    { type: 'upload', label: 'Photo Upload', icon: '📷' },
    { type: 'dropdown', label: 'Dropdown', icon: '▼' },
  ];

  const addField = (type: string) => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: type as FormField['type'],
      label: `${type} Field`,
      required: false,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex((f) => f.id === id);
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < fields.length - 1)) {
      const newFields = [...fields];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
      setFields(newFields);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" userName="Sarah" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <a href="/admin/stations" className="text-green-600 hover:text-green-700 font-semibold mb-4 inline-flex items-center">
              ← Back to Stations
            </a>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Form Builder</h1>
            <p className="text-gray-600 mt-2">{stationName}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Eye size={20} />
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
              <Save size={20} />
              Save Form
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Components Panel */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Components</h2>
              <div className="space-y-2">
                {componentOptions.map((comp) => (
                  <button
                    key={comp.type}
                    onClick={() => addField(comp.type)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  >
                    <p className="font-semibold text-gray-900 text-sm">
                      {comp.icon} {comp.label}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Form Editor / Preview */}
          <div className="lg:col-span-3">
            {showPreview ? (
              // Preview Mode
              <Card>
                <h2 className="text-lg font-bold text-gray-900 mb-6">Form Preview</h2>
                <div className="space-y-6 border-t border-gray-200 pt-6">
                  {fields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-600 ml-1">*</span>}
                      </label>

                      {field.type === 'rating' && (
                        <div className="flex gap-2">
                          {[...Array(5)].map((_, i) => (
                            <button key={i} className="text-3xl text-gray-300 hover:text-amber-400">
                              ⭐
                            </button>
                          ))}
                        </div>
                      )}

                      {field.type === 'category-rating' && (
                        <div className="space-y-3">
                          {['Washroom', 'Staff', 'Fuel', 'Cleanliness', 'Convenience', 'Safety'].map((cat) => (
                            <div key={cat}>
                              <p className="text-sm text-gray-700 mb-2">{cat}</p>
                              <div className="flex gap-2">
                                {[...Array(5)].map((_, i) => (
                                  <button key={i} className="text-2xl text-gray-300 hover:text-amber-400">
                                    ⭐
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {field.type === 'textarea' && (
                        <textarea rows={4} placeholder="Enter your feedback..." className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                      )}

                      {field.type === 'text' && (
                        <input type="text" placeholder="Enter text..." className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      )}

                      {field.type === 'upload' && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <p className="text-gray-600">Drag and drop files or click to upload</p>
                        </div>
                      )}

                      {field.type === 'dropdown' && (
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                          <option>Select an option</option>
                          <option>Option 1</option>
                          <option>Option 2</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              // Edit Mode
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-l-4 border-l-blue-600">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const updated = [...fields];
                            updated[index].label = e.target.value;
                            setFields(updated);
                          }}
                          className="w-full font-semibold text-gray-900 pb-2 border-b border-gray-200 focus:outline-none mb-3"
                          placeholder="Field label"
                        />
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">{field.type}</span>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => {
                                const updated = [...fields];
                                updated[index].required = e.target.checked;
                                setFields(updated);
                              }}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => moveField(field.id, 'up')}
                          disabled={index === 0}
                          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveField(field.id, 'down')}
                          disabled={index === fields.length - 1}
                          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeField(field.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
