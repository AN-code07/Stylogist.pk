import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiChevronLeft, FiTruck, FiShield, FiMapPin, FiPackage, FiPlus,
  FiCheck, FiAlertCircle, FiLoader, FiTrash2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import {
  useAddresses,
  useAddAddress,
} from '../features/addresses/useAddressHooks';
import { useCreateOrder } from '../features/orders/useOrderHooks';

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

const emptyAddress = {
  label: 'Home',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: 'Punjab',
  postalCode: '',
  country: 'Pakistan',
  isDefault: true,
};

export default function CheckoutPage() {
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const clearCart = useCartStore((s) => s.clear);

  const { data: addresses = [], isLoading: loadingAddresses } = useAddresses();
  const addAddressMut = useAddAddress();
  const createOrderMut = useCreateOrder();

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState(emptyAddress);

  // Select the default address (or first one) whenever the list loads or changes.
  useEffect(() => {
    if (addresses.length && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def._id);
    }
    if (!addresses.length) setShowAddForm(true);
  }, [addresses, selectedAddressId]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const shipping = 0; // Free delivery — matches backend order service.
  const total = subtotal + shipping;

  const handleAddAddress = async (e) => {
    e.preventDefault();
    const required = ['addressLine1', 'city', 'state', 'postalCode', 'country', 'label'];
    for (const f of required) {
      if (!newAddress[f]?.trim()) return toast.error(`${f} is required`);
    }
    try {
      const created = await addAddressMut.mutateAsync(newAddress);
      setSelectedAddressId(created._id);
      setShowAddForm(false);
      setNewAddress(emptyAddress);
    } catch { /* hook toast */ }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to place your order');
      return navigate('/login');
    }
    if (!items.length) return toast.error('Your cart is empty');
    if (!selectedAddressId) return toast.error('Choose a shipping address');

    const payload = {
      items: items.map((i) => ({
        productId: i.productId,
        sku: i.sku,
        quantity: i.quantity,
      })),
      addressId: selectedAddressId,
      paymentMethod: 'COD',
    };

    try {
      const order = await createOrderMut.mutateAsync(payload);
      toast.success('Order placed — you will pay on delivery.');
      clearCart();
      navigate('/profile', { state: { placedOrderId: order._id } });
    } catch { /* hook toast */ }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
          >
            <FiChevronLeft size={16} /> Back to cart
          </Link>
          <span className="text-base font-semibold tracking-tight">Stylogist.pk</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left — address + payment */}
        <section className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-md bg-[#007074]/10 text-[#007074] flex items-center justify-center">
                  <FiMapPin size={15} />
                </span>
                <h2 className="text-base font-semibold">Shipping address</h2>
              </div>
              {addresses.length > 0 && !showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-xs font-medium text-[#007074] hover:underline inline-flex items-center gap-1"
                >
                  <FiPlus size={12} /> Add new
                </button>
              )}
            </div>

            {!isAuthenticated ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-600">You'll need to sign in to check out.</p>
                <Link
                  to="/login"
                  className="inline-block mt-3 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d]"
                >
                  Sign in
                </Link>
              </div>
            ) : loadingAddresses ? (
              <div className="space-y-2">
                <div className="h-16 bg-slate-50 rounded-lg animate-pulse" />
                <div className="h-16 bg-slate-50 rounded-lg animate-pulse" />
              </div>
            ) : (
              <>
                {addresses.length > 0 && (
                  <div className="space-y-2">
                    {addresses.map((a) => (
                      <AddressOption
                        key={a._id}
                        address={a}
                        selected={selectedAddressId === a._id}
                        onSelect={() => setSelectedAddressId(a._id)}
                      />
                    ))}
                  </div>
                )}

                {showAddForm && (
                  <form
                    onSubmit={handleAddAddress}
                    className="mt-4 pt-4 border-t border-slate-100 space-y-3"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">New address</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Label (Home, Office…)"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      />
                      <Input
                        label="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      />
                    </div>

                    <Input
                      label="Address line 1"
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      placeholder="House / street / area"
                    />
                    <Input
                      label="Address line 2 (optional)"
                      value={newAddress.addressLine2}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                      placeholder="Apartment, suite, etc."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Select
                        label="Province"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        options={['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad Capital', 'Gilgit-Baltistan', 'AJK']}
                      />
                      <Input
                        label="Postal code"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      />
                      <Input
                        label="Country"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                      />
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={newAddress.isDefault}
                        onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                        className="w-4 h-4 accent-[#007074]"
                      />
                      Set as default
                    </label>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={addAddressMut.isPending}
                        className="px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 inline-flex items-center gap-2"
                      >
                        {addAddressMut.isPending && <FiLoader className="animate-spin" size={14} />}
                        Save address
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setShowAddForm(false); setNewAddress(emptyAddress); }}
                          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Payment (COD only, no cards, no form) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
              <span className="w-8 h-8 rounded-md bg-[#007074]/10 text-[#007074] flex items-center justify-center">
                <FiShield size={15} />
              </span>
              <h2 className="text-base font-semibold">Payment method</h2>
            </div>

            <div className="border-2 border-[#007074] bg-[#007074]/5 rounded-lg p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-md bg-white text-[#007074] flex items-center justify-center shadow-sm">
                <FiTruck size={18} />
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900">Cash on Delivery</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Pay in cash when your order arrives. No upfront payment, no card needed.
                </div>
              </div>
              <FiCheck className="text-[#007074]" size={18} />
            </div>
          </div>
        </section>

        {/* Right — summary */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
              <span className="w-8 h-8 rounded-md bg-[#007074]/10 text-[#007074] flex items-center justify-center">
                <FiPackage size={15} />
              </span>
              <h2 className="text-base font-semibold">Order summary</h2>
            </div>

            {items.length === 0 ? (
              <div className="py-10 text-center">
                <FiAlertCircle className="mx-auto text-slate-300 mb-2" size={28} />
                <p className="text-sm text-slate-500">Your cart is empty.</p>
                <Link
                  to="/category"
                  className="inline-block mt-3 text-sm text-[#007074] hover:underline"
                >
                  Continue shopping
                </Link>
              </div>
            ) : (
              <>
                <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {items.map((it) => (
                    <li key={`${it.productId}-${it.sku}`} className="flex gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <FiPackage size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{it.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">{it.sku}</div>
                        {(it.size || it.color) && (
                          <div className="text-[11px] text-slate-500 mt-0.5 capitalize">
                            {[it.color, it.size].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="inline-flex items-center border border-slate-200 rounded-md">
                            <button
                              type="button"
                              onClick={() => setQuantity(it.productId, it.sku, it.quantity - 1)}
                              disabled={it.quantity <= 1}
                              className="w-7 h-7 inline-flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                            >
                              −
                            </button>
                            <span className="w-7 text-center text-xs font-medium tabular-nums">{it.quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity(it.productId, it.sku, it.quantity + 1)}
                              className="w-7 h-7 inline-flex items-center justify-center text-slate-500 hover:bg-slate-50"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(it.productId, it.sku)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-slate-900 tabular-nums flex-shrink-0">
                        {fmtPKR(it.price * it.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-sm">
                  <Row label="Subtotal" value={fmtPKR(subtotal)} />
                  <Row
                    label="Shipping"
                    value={<span className="text-emerald-700 font-medium">FREE</span>}
                  />
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                    <span className="text-sm font-medium text-slate-900">Total</span>
                    <span className="text-lg font-semibold text-[#007074] tabular-nums">{fmtPKR(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={createOrderMut.isPending || !items.length || !selectedAddressId}
                  className="mt-5 w-full bg-[#007074] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#005a5d] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {createOrderMut.isPending ? (
                    <>
                      <FiLoader className="animate-spin" size={14} /> Placing order…
                    </>
                  ) : (
                    <>
                      <FiTruck size={14} /> Place order · COD
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <FiShield size={11} /> Secure cash-on-delivery checkout
                </div>
              </>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function AddressOption({ address, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left border rounded-lg p-4 transition-colors ${
        selected
          ? 'border-[#007074] bg-[#007074]/5 ring-2 ring-[#007074]/10'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{address.label}</span>
            {address.isDefault && (
              <span className="text-[10px] font-medium text-[#007074] bg-[#007074]/10 px-1.5 py-0.5 rounded">
                Default
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {[address.addressLine1, address.addressLine2, address.city, address.state, address.postalCode, address.country]
              .filter(Boolean)
              .join(', ')}
          </div>
        </div>
        <div
          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 ${
            selected ? 'border-[#007074] bg-[#007074]' : 'border-slate-300'
          }`}
        >
          {selected && <div className="w-full h-full rounded-full bg-white border-2 border-[#007074]" />}
        </div>
      </div>
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 inline-block">{label}</span>
      <input
        {...props}
        className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
      />
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 inline-block">{label}</span>
      <select
        {...props}
        className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span className="text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}
