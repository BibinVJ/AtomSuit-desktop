
import { useState, useEffect } from 'react';
import { cartLineCount, cartSubtotal } from '../../utils/cart';
import PageMeta from '../../components/common/PageMeta';
import Button from '../../components/ui/button/Button';
import Select from '../../components/form/Select';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import { useNavigate } from 'react-router';
import DatePicker from '../../components/form/date-picker';
import { formatDate } from '../../utils/date';
import { toast } from 'sonner';
import TextArea from '../../components/form/input/TextArea';
import { getCustomers } from '../../services/CustomerService';
import { getItems, getItem } from '../../services/ItemService';
import { getNextInvoiceNumber, addSale } from '../../services/SaleService';
import ButtonGroupRadio from '../../components/form/ButtonGroupRadio';
import EditCustomerModal from '../../components/customer/EditCustomerModal';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';

import AddCustomerModal from '../../components/customer/AddCustomerModal';
import { useModal } from '../../hooks/useModal';
import { Customer, Item } from '../../types';
import { Plus, Pencil, X } from 'lucide-react';
import { isApiError } from '../../utils/errors';
import { printComponent } from '../../../print/utils/printService';
import InvoiceA4 from '../../../print/invoices/InvoiceA4';

interface SaleItem {
  item_id: string;
  quantity: number;
  unit_price: number;
  description: string;
  stock_on_hand: number;
  unit_code?: string;
}

interface ApiError {
  [key: string]: string[];
}

export default function AddSale() {
  const { isOpen: isCustomerModalOpen, openModal: openCustomerModal, closeModal: closeCustomerModal } = useModal();
  const { isOpen: isEditCustomerModalOpen, openModal: openEditCustomerModal, closeModal: closeEditCustomerModal } = useModal();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [saleDate, setSaleDate] = useState(formatDate(new Date()));
  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    { item_id: '', quantity: 1, unit_price: 0, description: '', stock_on_hand: 0, unit_code: '' }
  ]);
  const [errors, setErrors] = useState<ApiError>({});
  const navigate = useNavigate();
  const [selectKey, setSelectKey] = useState(Date.now());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [customerResponse, itemResponse, invoiceResponse] = await Promise.all([
        getCustomers(1, 10, 'created_at', 'desc', true),
        getItems(1, 10, 'created_at', 'desc', true),
        getNextInvoiceNumber()
      ]);
      setCustomers(Array.isArray(customerResponse) ? customerResponse : customerResponse.data);
      setItems(Array.isArray(itemResponse) ? itemResponse : itemResponse.data);
      if (invoiceResponse) {
        setInvoiceNumber(invoiceResponse.data.invoice_number);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleAddItem = async (itemId: string) => {
    if (!itemId) return;

    if (saleItems.some(item => item.item_id === itemId)) {
      toast.info('Item is already in the list.');
      return;
    }

    try {
      const itemDetails = await getItem(itemId);
      const newItem: SaleItem = {
        item_id: itemId,
        quantity: 1,
        unit_price: itemDetails.selling_price || 0,
        description: '',
        stock_on_hand: (itemDetails.is_expired_sale_enabled
          ? itemDetails.stock_on_hand
          : itemDetails.non_expired_stock) || 0,
        unit_code: itemDetails.unit.code,
      };

      if (saleItems.length === 1 && saleItems[0].item_id === '') {
        setSaleItems([newItem]);
      } else {
        setSaleItems(prevItems => [...prevItems, newItem]);
      }
      
      // Clear the 'items' error when an item is added
      clearError('items');
    } catch (error) {
      console.error('Error fetching item details:', error);
      toast.error('Failed to add item.');
    }
  };

  const handleItemChange = async (index: number, field: keyof SaleItem, value: string | number) => {
    const newItems = [...saleItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'item_id' && value) {
      // Clear previous errors for this line item
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`items.${index}.`)) {
          delete newErrors[key as keyof ApiError];
        }
      });
      setErrors(newErrors);

      try {
        const itemDetails = await getItem(String(value));
        newItems[index].stock_on_hand = (itemDetails.is_expired_sale_enabled
          ? itemDetails.stock_on_hand
          : itemDetails.non_expired_stock) || 0;
        newItems[index].unit_code = itemDetails.unit.code;
      } catch (error) {
        console.error('Error fetching item details:', error);
        newItems[index].stock_on_hand = 0;
      }
    }

    setSaleItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...saleItems];
    newItems.splice(index, 1);
    
    // Clear all item-related errors and reindex them
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith('items.')) {
        delete newErrors[key as keyof ApiError];
      }
    });
    setErrors(newErrors);
    
    if (newItems.length === 0) {
      setSaleItems([{ item_id: '', quantity: 1, unit_price: 0, description: '', stock_on_hand: 0, unit_code: '' }]);
    } else {
      setSaleItems(newItems);
    }
  };

  const validateForm = () => {
    const newErrors: ApiError = {};

    if (!customerId) newErrors.customer_id = ['Customer is required.'];
    if (!invoiceNumber.trim()) newErrors.invoice_number = ['Invoice number is required.'];
    if (!saleDate) newErrors.sale_date = ['Sale date is required.'];
    if (saleItems.length === 0 || (saleItems.length === 1 && !saleItems[0].item_id)) {
      newErrors.items = ['At least one item is required.'];
    }

    saleItems.forEach((item, index) => {
      if (item.item_id) { // Only validate if item is selected
        if (item.quantity <= 0) newErrors[`items.${index}.quantity`] = ['Quantity must be greater than 0.'];
        if (item.quantity > item.stock_on_hand) newErrors[`items.${index}.quantity`] = [`Available stock ${item.stock_on_hand}.`];
        if (item.unit_price < 0) newErrors[`items.${index}.unit_price`] = ['Unit price cannot be negative.'];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveSale = async () => {
    if (!validateForm()) {
      toast.error('Please correct the errors');
      return null;
    }

    try {
      const response = await addSale({
        customer_id: customerId,
        invoice_number: invoiceNumber,
        sale_date: saleDate,
        status: 'completed',
        payment_status: 'paid',
        payment_method: paymentMethod,
        note: note,
        items: saleItems.map(({ unit_code: _, ...item }) => item),
      });
      toast.success('Sale created successfully');
      return response;
    } catch (error: unknown) {
      if (isApiError(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        toast.error('Please correct the errors in the form');
      } else {
        console.error('Error creating sale:', error);
        toast.error('Failed to create sale');
      }
      return null;
    }
  };

  const handleSave = async () => {
    const result = await saveSale();
    if (result) {
      // Reset form for new sale
      resetForm();
    }
  };

  const handleSaveAndPrint = async () => {
    const result = await saveSale();
    if (result) {
      // Generate and print PDF
      try {
        const printData = {
          sale: result.data,
          customer: customers.find(c => String(c.id) === customerId),
          items: saleItems.filter(item => item.item_id).map(item => ({
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            item: {
              name: items.find(i => String(i.id) === item.item_id)?.name || ''
            }
          }))
        };
        
        // Call print function
        await printSaleReceipt(printData);
        // Reset form for new sale
        resetForm();
      } catch (error) {
        console.error('Error printing receipt:', error);
        toast.error('Sale saved but printing failed');
        // Reset form anyway
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setSelectedCustomer(null);
    setSaleItems([{ item_id: '', quantity: 1, unit_price: 0, description: '', stock_on_hand: 0, unit_code: '' }]);
    setNote('');
    setErrors({});
    // Get new invoice number
    fetchInitialData();
  };

  const printSaleReceipt = async (data: any) => {
    const filename = `${data.sale.invoice_number}-${data.customer?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Walk-in'}`;
    printComponent(InvoiceA4, { data }, filename);
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getErrorMessage = (field: string) => errors[field]?.[0] || '';

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    setCustomerId(String(newCustomer.id));
    closeCustomerModal();
  };

  const handleCustomerUpdated = () => {
    fetchInitialData();
    closeEditCustomerModal();
  };

  useEffect(() => {
    if (customerId) {
      const customer = customers.find(c => String(c.id) === customerId);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [customerId, customers]);

  return (
    <>
      <PageMeta
        title="Add Sale"
        description="Add a new sale"
      />
      <div className="px-6 py-5">
        <form className="flex flex-col md:flex-row gap-6">

          {/* LEFT SECTION (Items) */}
          <div className="flex-1 overflow-y-auto max-h-[80vh] pr-2">
            {/* Search bar */}
            <Select
              key={selectKey}
              options={items.map(i => ({ value: String(i.id), label: i.name }))}
              placeholder="Search and add an item..."
              onChange={(value) => {
                if (value) {
                  handleAddItem(value);
                  setSelectKey(Date.now());
                }
              }}
              className="mb-4"
            />

            {getErrorMessage('items') && (
              <p className="text-sm text-red-500 mb-4">{getErrorMessage('items')}</p>
            )}

            {/* Scrollable Item List */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-2/5">Item</TableCell>
                      <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/5">Stock on Hand</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/5">Quantity</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/5">Unit Price</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400">Total</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-16">Action</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {saleItems.map((item, index) => (
                    item.item_id && (
                      <TableRow key={index}>
                        <TableCell className="px-4 py-3 align-top">
                          <Input
                            type="text"
                            value={items.find(i => String(i.id) === item.item_id)?.name || ''}
                            readOnly
                            style={{ minWidth: '200px' }}
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <p className={`text-center ${item.stock_on_hand === 0 ? 'text-red-500' :
                            item.stock_on_hand < 20 ? 'text-orange-500' : 'text-gray-500'
                            }`}>
                            {item.stock_on_hand}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            error={!!getErrorMessage(`items.${index}.quantity`)}
                            hint={getErrorMessage(`items.${index}.quantity`)}
                            suffix={item.unit_code}
                            style={{ minWidth: '100px' }}
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                            error={!!getErrorMessage(`items.${index}.unit_price`)}
                            hint={getErrorMessage(`items.${index}.unit_price`)}
                            style={{ minWidth: '120px' }}
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-end dark:text-gray-400">
                          <span className="font-bold">
                            {(item.quantity * item.unit_price).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Button
                            size="xs"
                            variant="danger"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  ))}
                </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION (Customer + Totals + Actions) */}
          <div className="w-full md:w-1/3 flex flex-col sticky top-4 self-start space-y-12">

            {/* Customer + Invoice */}
            <div className="space-y-4">
              <div>
                <Label>Customer</Label>
                <div className="flex items-center gap-2">
                  <Select
                    options={customers.map(c => ({ value: String(c.id), label: c.name }))}
                    onChange={(value) => { setCustomerId(value); clearError('customer_id'); }}
                    defaultValue={customerId}
                    placeholder="Select a customer"
                    error={!!getErrorMessage('customer_id')}
                    hint={getErrorMessage('customer_id')}
                    className="flex-grow"
                  />
                  {selectedCustomer && (
                    <Button type="button" onClick={openEditCustomerModal} size="xs">
                      <Pencil />
                    </Button>
                  )}
                  <Button type="button" onClick={openCustomerModal} size="xs">
                    <Plus />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label>Invoice Number</Label>
                  <Input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => { setInvoiceNumber(e.target.value); clearError('invoice_number'); }}
                    error={!!getErrorMessage('invoice_number')}
                    hint={getErrorMessage('invoice_number')}
                  />
                </div>

                <DatePicker
                  id="sale_date"
                  label="Sale Date"
                  onChange={(_, dateStr) => { setSaleDate(dateStr); clearError('sale_date'); }}
                  defaultDate={saleDate}
                  error={!!getErrorMessage('sale_date')}
                  hint={getErrorMessage('sale_date')}
                />
              </div>

              <div>
                <Label>Note</Label>
                <TextArea
                  value={note}
                  onChange={(value) => { setNote(value); clearError('note'); }}
                  placeholder="Add a note for this sale..."
                />
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-3 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-bold">{cartLineCount(saleItems)}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Total:</span>
                <span className="font-bold">
                  {cartSubtotal(saleItems).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (0%):</span>
                <span className="font-bold">
                  {(cartSubtotal(saleItems) * 0.0).toFixed(2)}
                </span>
              </div>
              {/* <div className="flex justify-between">
                <span>Discount:</span>
                <Input type="number" placeholder="0" className="w-20" />
              </div> */}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>
                  {(cartSubtotal(saleItems) * 1.0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment + Actions */}
            <div className="space-y-4">
              <Label>Payment Method</Label>
              <ButtonGroupRadio
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'upi', label: 'UPI' },
                  { value: 'card', label: 'Card' }
                ]}
                selectedValue={paymentMethod}
                onChange={setPaymentMethod}
              />
              <div className="flex justify-end gap-3 w-full">
                <Button type="button" variant="outline" className='w-full' onClick={handleSave}>
                  Save
                </Button>
                <Button type="button" className='w-full' onClick={handleSaveAndPrint}>
                  Save & Print
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <AddCustomerModal isOpen={isCustomerModalOpen} onClose={closeCustomerModal} onCustomerAdded={handleCustomerAdded} />
      {selectedCustomer && (
        <EditCustomerModal
          isOpen={isEditCustomerModalOpen}
          onClose={closeEditCustomerModal}
          onCustomerUpdated={handleCustomerUpdated}
          customer={selectedCustomer}
        />
      )}
    </>
  );
}
