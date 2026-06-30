import React, { useState } from 'react';

export interface AddressInput {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Props {
  initial?: Partial<AddressInput>;
  onSubmit: (a: AddressInput) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
}

const empty: AddressInput = { full_name: '', phone: '', address: '', city: '', state: '', pincode: '' };

const AddressForm = ({ initial, onSubmit, onCancel, submitLabel = 'Save Address' }: Props) => {
  const [data, setData] = useState<AddressInput>({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setData({ ...data, [e.target.name]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSubmit(data); } finally { setSaving(false); }
  };

  const input = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input name="full_name" required value={data.full_name} onChange={change} className={input} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input name="phone" type="tel" required value={data.phone} onChange={change} className={input} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea name="address" required rows={3} value={data.address} onChange={change} className={input} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input name="city" required value={data.city} onChange={change} className={input} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input name="state" required value={data.state} onChange={change} className={input} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input name="pincode" required value={data.pincode} onChange={change} className={input} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium">
          {saving ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
        )}
      </div>
    </form>
  );
};

export default AddressForm;
