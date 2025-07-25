import axios from 'axios';
import { InventoryItem, Requisition, PurchaseOrder, DashboardStats, Requester, Department, Order, BOM, Prototype, CostCenter, Report, InventoryValuation, PurchaseHistory, Supplier } from '../types';
import { CabinetConfiguration, CabinetProject } from '../types/cabinet';

// Simplified API URL resolution using Vite's environment detection
const getApiUrl = () => {
  // In development, use Vite proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use relative API path
  return '/api';
};

const API_BASE_URL = getApiUrl();

console.log('Main API URL:', API_BASE_URL); // Debug log

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Check if error is due to server not being available
    const isServerUnavailable = 
      axios.isAxiosError(error) && 
      (error.code === 'ECONNREFUSED' || 
       error.code === 'ERR_NETWORK' || 
       error.message.includes('Network Error') ||
       (error.response && error.response.status >= 500));
    
    if (isServerUnavailable) {
      console.log('Server unavailable, using mock data');
      // Let the specific service methods handle the fallback
      return Promise.reject({ ...error, isServerUnavailable: true });
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Cabinet Calculator API service
export const cabinetService = {
  async createBOM(config: CabinetConfiguration): Promise<BOM> {
    try {
      const response = await api.post('/boms', {
        bomNumber: `BOM-${Date.now().toString().slice(-6)}`,
        name: `BOM for ${config.name}`,
        version: '1.0',
        linkedType: 'cabinet',
        linkedId: config.id,
        linkedNumber: config.id,
        status: 'draft',
        description: `Bill of Materials for ${config.name}`,
        category: 'Cabinet',
        items: [
          ...config.materials.map(material => ({
            id: material.id,
            itemId: material.materialId,
            itemName: material.materialName,
            quantity: material.quantity,
            unitCost: material.unitCost,
            totalCost: material.totalCost,
            unitMeasurement: 'Sheets',
            isOptional: false
          })),
          ...config.hardware.map(hardware => ({
            id: hardware.id,
            itemId: hardware.hardwareId,
            itemName: hardware.hardwareName,
            quantity: hardware.quantity,
            unitCost: hardware.unitCost,
            totalCost: hardware.totalCost,
            unitMeasurement: 'Pieces',
            isOptional: false
          }))
        ],
        totalCost: config.totalCost,
        estimatedTime: config.laborCost / 45, // Assuming $45/hour labor rate
        createdBy: 'Cabinet Calculator'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create BOM:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: `bom-${Date.now()}`,
          bomNumber: `BOM-${Date.now().toString().slice(-6)}`,
          name: `BOM for ${config.name}`,
          version: '1.0',
          linkedType: 'cabinet',
          linkedId: config.id,
          linkedNumber: config.id,
          status: 'draft',
          description: `Bill of Materials for ${config.name}`,
          category: 'Cabinet',
          items: [
            ...config.materials.map(material => ({
              id: material.id,
              itemId: material.materialId,
              itemName: material.materialName,
              quantity: material.quantity,
              unitCost: material.unitCost,
              totalCost: material.totalCost,
              unitMeasurement: 'Sheets',
              isOptional: false
            })),
            ...config.hardware.map(hardware => ({
              id: hardware.id,
              itemId: hardware.hardwareId,
              itemName: hardware.hardwareName,
              quantity: hardware.quantity,
              unitCost: hardware.unitCost,
              totalCost: hardware.totalCost,
              unitMeasurement: 'Pieces',
              isOptional: false
            }))
          ],
          totalCost: config.totalCost,
          estimatedTime: config.laborCost / 45,
          createdBy: 'Cabinet Calculator',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      throw error;
    }
  },

  async createOrder(project: CabinetProject): Promise<Order> {
    try {
      const response = await api.post('/orders', {
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: project.customerName,
        customerContact: project.customerContact,
        orderType: 'production',
        status: 'draft',
        priority: 'medium',
        orderDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + project.estimatedDays * 24 * 60 * 60 * 1000).toISOString(),
        description: project.description || `Cabinet order for ${project.customerName}`,
        notes: project.notes,
        estimatedCost: project.total,
        actualCost: 0
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: `order-${Date.now()}`,
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          customerName: project.customerName,
          customerContact: project.customerContact,
          orderType: 'production',
          status: 'draft',
          priority: 'medium',
          orderDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + project.estimatedDays * 24 * 60 * 60 * 1000).toISOString(),
          description: project.description || `Cabinet order for ${project.customerName}`,
          notes: project.notes,
          estimatedCost: project.total,
          actualCost: 0,
          bomCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      throw error;
    }
  },

  async optimizeNesting(cuttingList: any[]): Promise<any[]> {
    try {
      const response = await api.post('/cabinet-calculator/nesting', { cuttingList });
      return response.data;
    } catch (error) {
      console.error('Failed to optimize nesting:', error);
      
      // Return empty array if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [];
      }
      
      throw error;
    }
  }
};

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const response = await api.get('/inventory/products');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [
          {
            id: '1',
            itemId: 'PLY-18-4X8',
            name: 'Plywood 18mm 4x8ft',
            category: 'Panels',
            subCategory: 'Cabinet Body',
            quantity: 45,
            unitCost: 52.75,
            totalCost: 2373.75,
            location: 'A-1-01',
            supplier: 'Wood Supply Co.',
            unitMeasurement: 'Sheets (sht)',
            minStockLevel: 10,
            maxStockLevel: 100,
            lastUpdated: new Date().toISOString(),
          },
          {
            id: '2',
            itemId: 'MDF-18-4X8',
            name: 'MDF 18mm 4x8ft',
            category: 'Panels',
            subCategory: 'Cabinet Body',
            quantity: 32,
            unitCost: 38.90,
            totalCost: 1244.80,
            location: 'A-1-02',
            supplier: 'Wood Supply Co.',
            unitMeasurement: 'Sheets (sht)',
            minStockLevel: 8,
            maxStockLevel: 80,
            lastUpdated: new Date().toISOString(),
          },
          {
            id: '3',
            itemId: 'HNG-CONC-35',
            name: 'Concealed Hinges 35mm',
            category: 'Hardware',
            subCategory: 'Door Hardware',
            quantity: 485,
            unitCost: 3.25,
            totalCost: 1576.25,
            location: 'B-1-01',
            supplier: 'Hardware Plus',
            unitMeasurement: 'Pieces (pcs)',
            minStockLevel: 100,
            maxStockLevel: 1000,
            lastUpdated: new Date().toISOString(),
          }
        ];
      }
      
      throw error;
    }
  },

  async getById(id: string): Promise<InventoryItem> {
    try {
      const response = await api.get(`/inventory/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch inventory item:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          itemId: 'PLY-18-4X8',
          name: 'Plywood 18mm 4x8ft',
          category: 'Panels',
          subCategory: 'Cabinet Body',
          quantity: 45,
          unitCost: 52.75,
          totalCost: 2373.75,
          location: 'A-1-01',
          supplier: 'Wood Supply Co.',
          unitMeasurement: 'Sheets (sht)',
          minStockLevel: 10,
          maxStockLevel: 100,
          lastUpdated: new Date().toISOString(),
        };
      }
      
      throw error;
    }
  },

  async create(item: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const response = await api.post('/inventory/products', item);
      return response.data;
    } catch (error) {
      console.error('Failed to create inventory item:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: Date.now().toString(),
          ...item,
          totalCost: (item.quantity || 0) * (item.unitCost || 0),
          lastUpdated: new Date().toISOString()
        } as InventoryItem;
      }
      
      throw error;
    }
  },

  async update(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const response = await api.put(`/inventory/products/${id}`, item);
      return response.data;
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          ...item,
          totalCost: (item.quantity || 0) * (item.unitCost || 0),
          lastUpdated: new Date().toISOString()
        } as InventoryItem;
      }
      
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/inventory/products/${id}`);
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      
      // Just log if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        console.log('Mock delete - server unavailable');
        return;
      }
      
      throw error;
    }
  },

  async importFromExcel(file: File): Promise<{ success: boolean; count: number }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/inventory/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to import from Excel:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return { success: true, count: 0 };
      }
      
      throw error;
    }
  },

  async exportToPDF(): Promise<Blob> {
    try {
      const response = await api.get('/inventory/export', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export to PDF:', error);
      
      // Return empty blob if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return new Blob([''], { type: 'application/pdf' });
      }
      
      throw error;
    }
  },
};

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    try {
      const response = await api.get('/purchase-orders');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [
          {
            id: '1',
            poNumber: 'PO-2024-0001',
            supplier: 'Wood Supply Co.',
            status: 'approved',
            items: [
              {
                id: '1',
                itemId: 'PLY-18-4X8',
                itemName: 'Plywood 18mm 4x8ft',
                quantity: 50,
                unitCost: 52.75,
                totalCost: 2637.50
              },
              {
                id: '2',
                itemId: 'MDF-18-4X8',
                itemName: 'MDF 18mm 4x8ft',
                quantity: 30,
                unitCost: 38.90,
                totalCost: 1167.00
              }
            ],
            subtotal: 3804.50,
            tax: 380.45,
            total: 4184.95,
            orderDate: new Date().toISOString(),
            expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Urgent delivery required for production schedule',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            poNumber: 'PO-2024-0002',
            supplier: 'Hardware Plus',
            status: 'pending',
            items: [
              {
                id: '3',
                itemId: 'HNG-CONC-35',
                itemName: 'Concealed Hinges 35mm',
                quantity: 200,
                unitCost: 3.25,
                totalCost: 650.00
              },
              {
                id: '4',
                itemId: 'SLD-18-FULL',
                itemName: 'Full Extension Slides 18"',
                quantity: 50,
                unitCost: 12.50,
                totalCost: 625.00
              }
            ],
            subtotal: 1275.00,
            tax: 127.50,
            total: 1402.50,
            orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            expectedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Standard delivery terms',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            poNumber: 'PO-2024-0003',
            supplier: 'Laminate Plus',
            status: 'ordered',
            items: [
              {
                id: '5',
                itemId: 'MEL-WHT-4X8',
                itemName: 'White Melamine 4x8ft',
                quantity: 25,
                unitCost: 68.50,
                totalCost: 1712.50
              }
            ],
            subtotal: 1712.50,
            tax: 171.25,
            total: 1883.75,
            orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
      
      throw error;
    }
  },

  async getById(id: string): Promise<PurchaseOrder> {
    try {
      const response = await api.get(`/purchase-orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch purchase order:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          poNumber: `PO-2024-${id}`,
          supplier: 'Mock Supplier',
          status: 'draft',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          orderDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      throw error;
    }
  },

  async create(po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    try {
      const response = await api.post('/purchase-orders', po);
      return response.data;
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: Date.now().toString(),
          ...po,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as PurchaseOrder;
      }
      
      throw error;
    }
  },

  async update(id: string, po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    try {
      const response = await api.put(`/purchase-orders/${id}`, po);
      return response.data;
    } catch (error) {
      console.error('Failed to update purchase order:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          ...po,
          updatedAt: new Date().toISOString()
        } as PurchaseOrder;
      }
      
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/purchase-orders/${id}`);
    } catch (error) {
      console.error('Failed to delete purchase order:', error);
      
      // Just log if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        console.log('Purchase order deleted (mock)');
        return;
      }
      
      throw error;
    }
  },

  async approve(id: string): Promise<PurchaseOrder> {
    try {
      const response = await api.patch(`/purchase-orders/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error('Failed to approve purchase order:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          status: 'approved',
          updatedAt: new Date().toISOString()
        } as PurchaseOrder;
      }
      
      throw error;
    }
  },
};

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    try {
      const response = await api.get('/suppliers');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [
          {
            id: '1',
            name: 'Wood Supply Co.',
            contactPerson: 'John Anderson',
            phone: '(555) 123-4567',
            email: 'orders@woodsupply.com',
            address: '123 Industrial Blvd, Manufacturing City, MC 12345',
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Hardware Plus',
            contactPerson: 'Sarah Mitchell',
            phone: '(555) 987-6543',
            email: 'sales@hardwareplus.com',
            address: '456 Hardware Ave, Supply Town, ST 67890',
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Laminate Plus',
            contactPerson: 'Mike Johnson',
            phone: '(555) 456-7890',
            email: 'info@laminateplus.com',
            address: '789 Laminate Dr, Finish City, FC 11111',
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ];
      }
      
      throw error;
    }
  },

  async create(supplier: Partial<Supplier>): Promise<Supplier> {
    try {
      const response = await api.post('/suppliers', supplier);
      return response.data;
    } catch (error) {
      console.error('Failed to create supplier:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: Date.now().toString(),
          ...supplier,
          isActive: true,
          createdAt: new Date().toISOString()
        } as Supplier;
      }
      
      throw error;
    }
  },

  async update(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    try {
      const response = await api.put(`/suppliers/${id}`, supplier);
      return response.data;
    } catch (error) {
      console.error('Failed to update supplier:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          ...supplier,
          createdAt: new Date().toISOString()
        } as Supplier;
      }
      
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/suppliers/${id}`);
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      
      // Just log if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        console.log('Supplier deleted (mock)');
        return;
      }
      
      throw error;
    }
  },
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        const recentActivity = [
          { id: 1, action: 'Product Added', item: 'Kitchen Cabinet Set A', timestamp: new Date().toISOString() },
          { id: 2, action: 'Stock Updated', item: 'Bathroom Vanity B', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: 3, action: 'Order Completed', item: 'Living Room Cabinet C', timestamp: new Date(Date.now() - 7200000).toISOString() },
          { id: 4, action: 'Requisition Approved', item: 'Hardware Supplies', timestamp: new Date(Date.now() - 10800000).toISOString() },
          { id: 5, action: 'Purchase Order Created', item: 'Plywood 18mm', timestamp: new Date(Date.now() - 14400000).toISOString() },
        ];
        
        return {
          totalItems: 1247,
          lowStockItems: 23,
          pendingRequisitions: 8,
          openPurchaseOrders: 12,
          monthlyExpenditure: 67000,
          inventoryValue: 350000,
          recentActivity
        };
      }
      
      throw error;
    }
  },
};

export const requesterService = {
  async getAll(): Promise<Requester[]> {
    try {
      const response = await api.get('/requesters');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch requesters:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [
          {
            id: '1',
            name: 'John Smith',
            email: 'john.smith@company.com',
            employeeId: 'EMP001',
            department: 'Production',
            position: 'Production Supervisor',
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@company.com',
            employeeId: 'EMP002',
            department: 'Assembly',
            position: 'Assembly Lead',
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Mike Wilson',
            email: 'mike.wilson@company.com',
            employeeId: 'EMP003',
            department: 'Quality Control',
            position: 'QC Inspector',
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ];
      }
      
      throw error;
    }
  },

  async create(requester: Partial<Requester>): Promise<Requester> {
    try {
      const response = await api.post('/requesters', requester);
      return response.data;
    } catch (error) {
      console.error('Failed to create requester:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: Date.now().toString(),
          ...requester,
          isActive: true,
          createdAt: new Date().toISOString()
        } as Requester;
      }
      
      throw error;
    }
  },

  async update(id: string, requester: Partial<Requester>): Promise<Requester> {
    try {
      const response = await api.put(`/requesters/${id}`, requester);
      return response.data;
    } catch (error) {
      console.error('Failed to update requester:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          ...requester,
          createdAt: new Date().toISOString()
        } as Requester;
      }
      
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/requesters/${id}`);
    } catch (error) {
      console.error('Failed to delete requester:', error);
      
      // Just log if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        console.log('Requester deleted (mock)');
        return;
      }
      
      throw error;
    }
  },
};

export const departmentService = {
  async getAll(): Promise<Department[]> {
    try {
      const response = await api.get('/departments');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [
          {
            id: '1',
            name: 'Production',
            code: 'PROD',
            description: 'Manufacturing and production operations',
            manager: 'John Smith',
            costCenter: 'CC001',
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Assembly',
            code: 'ASSY',
            description: 'Product assembly and finishing',
            manager: 'Sarah Johnson',
            costCenter: 'CC002',
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Quality Control',
            code: 'QC',
            description: 'Quality assurance and testing',
            manager: 'Mike Wilson',
            costCenter: 'CC003',
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ];
      }
      
      throw error;
    }
  },

  async create(department: Partial<Department>): Promise<Department> {
    try {
      const response = await api.post('/departments', department);
      return response.data;
    } catch (error) {
      console.error('Failed to create department:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: Date.now().toString(),
          ...department,
          isActive: true,
          createdAt: new Date().toISOString()
        } as Department;
      }
      
      throw error;
    }
  },

  async update(id: string, department: Partial<Department>): Promise<Department> {
    try {
      const response = await api.put(`/departments/${id}`, department);
      return response.data;
    } catch (error) {
      console.error('Failed to update department:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          ...department,
          createdAt: new Date().toISOString()
        } as Department;
      }
      
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/departments/${id}`);
    } catch (error) {
      console.error('Failed to delete department:', error);
      
      // Just log if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        console.log('Department deleted (mock)');
        return;
      }
      
      throw error;
    }
  },
};

export const costCenterService = {
  async getAll(): Promise<CostCenter[]> {
    try {
      const response = await api.get('/cost-centers');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cost centers:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [
          {
            id: '1',
            code: 'CC-001',
            name: 'Production Operations',
            description: 'Manufacturing and production activities',
            budget: 50000,
            actualSpent: 42500,
            budgetPeriod: 'monthly',
            manager: 'John Smith',
            department: 'Production',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            code: 'CC-002',
            name: 'Assembly Operations',
            description: 'Cabinet assembly and finishing',
            budget: 35000,
            actualSpent: 38200,
            budgetPeriod: 'monthly',
            manager: 'Sarah Johnson',
            department: 'Assembly',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
      
      throw error;
    }
  },

  async create(costCenter: Partial<CostCenter>): Promise<CostCenter> {
    try {
      const response = await api.post('/cost-centers', costCenter);
      return response.data;
    } catch (error) {
      console.error('Failed to create cost center:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: Date.now().toString(),
          ...costCenter,
          actualSpent: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as CostCenter;
      }
      
      throw error;
    }
  },

  async update(id: string, costCenter: Partial<CostCenter>): Promise<CostCenter> {
    try {
      const response = await api.put(`/cost-centers/${id}`, costCenter);
      return response.data;
    } catch (error) {
      console.error('Failed to update cost center:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          ...costCenter,
          updatedAt: new Date().toISOString()
        } as CostCenter;
      }
      
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/cost-centers/${id}`);
    } catch (error) {
      console.error('Failed to delete cost center:', error);
      
      // Just log if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        console.log('Cost center deleted (mock)');
        return;
      }
      
      throw error;
    }
  },
};

export const reportService = {
  async getAll(): Promise<Report[]> {
    try {
      const response = await api.get('/reports');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [];
      }
      
      throw error;
    }
  },

  async generate(type: string, parameters: any): Promise<Report> {
    try {
      const response = await api.post('/reports/generate', { type, parameters });
      return response.data;
    } catch (error) {
      console.error('Failed to generate report:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: Date.now().toString(),
          name: `${type} Report - ${new Date().toLocaleDateString()}`,
          type: type as any,
          description: `Generated ${type} report`,
          parameters,
          generatedBy: 'admin',
          generatedAt: new Date().toISOString(),
          status: 'completed',
          fileUrl: `/reports/${type}-${Date.now()}.pdf`,
          fileSize: Math.floor(Math.random() * 3000000) + 500000
        };
      }
      
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/reports/${id}`);
    } catch (error) {
      console.error('Failed to delete report:', error);
      
      // Just log if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        console.log('Report deleted (mock)');
        return;
      }
      
      throw error;
    }
  },

  async getInventoryValuation(filters?: any): Promise<InventoryValuation[]> {
    try {
      const response = await api.get('/reports/inventory-valuation', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch inventory valuation:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [];
      }
      
      throw error;
    }
  },

  async getPurchaseHistory(itemId: string): Promise<PurchaseHistory[]> {
    try {
      const response = await api.get(`/reports/purchase-history/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch purchase history:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [];
      }
      
      throw error;
    }
  },
};

export const orderService = {
  async getAll(): Promise<Order[]> {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [
          {
            id: '1',
            orderNumber: 'ORD-2024-001',
            customerName: 'ABC Kitchen Renovations',
            customerContact: 'John Doe - (555) 123-4567',
            orderType: 'production',
            status: 'in_progress',
            priority: 'high',
            orderDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Complete kitchen cabinet set - Modern style',
            estimatedCost: 15000,
            actualCost: 0,
            assignedTo: 'John Smith',
            department: 'Production',
            bomCount: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            orderNumber: 'ORD-2024-002',
            customerName: 'XYZ Home Builders',
            customerContact: 'Jane Smith - (555) 987-6543',
            orderType: 'custom',
            status: 'confirmed',
            priority: 'medium',
            orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Custom bathroom vanity with matching mirror cabinet',
            estimatedCost: 8500,
            actualCost: 0,
            assignedTo: 'Sarah Johnson',
            department: 'Assembly',
            bomCount: 2,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
      
      throw error;
    }
  },

  async create(order: Partial<Order>): Promise<Order> {
    try {
      const response = await api.post('/orders', order);
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: Date.now().toString(),
          ...order,
          bomCount: 0,
          actualCost: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Order;
      }
      
      throw error;
    }
  },

  async update(id: string, order: Partial<Order>): Promise<Order> {
    try {
      const response = await api.put(`/orders/${id}`, order);
      return response.data;
    } catch (error) {
      console.error('Failed to update order:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          ...order,
          updatedAt: new Date().toISOString()
        } as Order;
      }
      
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/orders/${id}`);
    } catch (error) {
      console.error('Failed to delete order:', error);
      
      // Just log if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        console.log('Order deleted (mock)');
        return;
      }
      
      throw error;
    }
  },
};

export const bomService = {
  async getAll(): Promise<BOM[]> {
    try {
      const response = await api.get('/boms');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch BOMs:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [
          {
            id: '1',
            bomNumber: 'BOM-2024-001',
            name: 'Kitchen Base Cabinet - 24"',
            version: '1.0',
            linkedType: 'order',
            linkedId: '1',
            linkedNumber: 'ORD-2024-001',
            status: 'approved',
            description: 'Standard 24" base cabinet with single door',
            category: 'Base Cabinets',
            items: [
              {
                id: '1',
                itemId: 'PLY-18-4X8',
                itemName: 'Plywood 18mm 4x8ft',
                quantity: 2,
                unitCost: 52.75,
                totalCost: 105.50,
                unitMeasurement: 'Sheets',
                isOptional: false
              },
              {
                id: '2',
                itemId: 'HNG-CONC-35',
                itemName: 'Concealed Hinges 35mm',
                quantity: 2,
                unitCost: 3.25,
                totalCost: 6.50,
                unitMeasurement: 'Pieces',
                isOptional: false
              }
            ],
            totalCost: 112.00,
            estimatedTime: 4,
            createdBy: 'John Smith',
            approvedBy: 'Manager',
            approvalDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            bomNumber: 'BOM-2024-002',
            name: 'Kitchen Wall Cabinet - 30"',
            version: '1.0',
            linkedType: 'order',
            linkedId: '1',
            linkedNumber: 'ORD-2024-001',
            status: 'in_production',
            description: 'Standard 30" wall cabinet with double doors',
            category: 'Wall Cabinets',
            items: [
              {
                id: '3',
                itemId: 'PLY-18-4X8',
                itemName: 'Plywood 18mm 4x8ft',
                quantity: 1.5,
                unitCost: 52.75,
                totalCost: 79.13,
                unitMeasurement: 'Sheets',
                isOptional: false
              }
            ],
            totalCost: 79.13,
            estimatedTime: 3,
            createdBy: 'Sarah Johnson',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
      
      throw error;
    }
  },

  async create(bom: Partial<BOM>): Promise<BOM> {
    try {
      const response = await api.post('/boms', bom);
      return response.data;
    } catch (error) {
      console.error('Failed to create BOM:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: Date.now().toString(),
          ...bom,
          items: bom.items || [],
          totalCost: bom.totalCost || 0,
          estimatedTime: bom.estimatedTime || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as BOM;
      }
      
      throw error;
    }
  },

  async update(id: string, bom: Partial<BOM>): Promise<BOM> {
    try {
      const response = await api.put(`/boms/${id}`, bom);
      return response.data;
    } catch (error) {
      console.error('Failed to update BOM:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          ...bom,
          updatedAt: new Date().toISOString()
        } as BOM;
      }
      
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/boms/${id}`);
    } catch (error) {
      console.error('Failed to delete BOM:', error);
      
      // Just log if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        console.log('BOM deleted (mock)');
        return;
      }
      
      throw error;
    }
  },

  async getByLinkedId(linkedType: 'order' | 'prototype' | 'cabinet', linkedId: string): Promise<BOM[]> {
    try {
      const response = await api.get(`/boms/linked/${linkedType}/${linkedId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch linked BOMs:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        // Return filtered mock data
        const allBoms = await this.getAll();
        return allBoms.filter(bom => bom.linkedType === linkedType && bom.linkedId === linkedId);
      }
      
      throw error;
    }
  },
};

export const prototypeService = {
  async getAll(): Promise<Prototype[]> {
    try {
      const response = await api.get('/prototypes');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch prototypes:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return [
          {
            id: '1',
            prototypeNumber: 'PROTO-2024-001',
            name: 'Modular Kitchen Island',
            description: 'Innovative modular kitchen island with adjustable components',
            status: 'testing',
            category: 'Kitchen Islands',
            designer: 'Design Team',
            createdDate: new Date().toISOString(),
            bomCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            prototypeNumber: 'PROTO-2024-002',
            name: 'Smart Storage Cabinet',
            description: 'Cabinet with integrated smart storage solutions',
            status: 'approved',
            category: 'Storage Solutions',
            designer: 'Innovation Lab',
            createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            approvalDate: new Date().toISOString(),
            bomCount: 2,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
      
      throw error;
    }
  },

  async create(prototype: Partial<Prototype>): Promise<Prototype> {
    try {
      const response = await api.post('/prototypes', prototype);
      return response.data;
    } catch (error) {
      console.error('Failed to create prototype:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id: Date.now().toString(),
          ...prototype,
          bomCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Prototype;
      }
      
      throw error;
    }
  },

  async update(id: string, prototype: Partial<Prototype>): Promise<Prototype> {
    try {
      const response = await api.put(`/prototypes/${id}`, prototype);
      return response.data;
    } catch (error) {
      console.error('Failed to update prototype:', error);
      
      // Return mock data if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        return {
          id,
          ...prototype,
          updatedAt: new Date().toISOString()
        } as Prototype;
      }
      
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/prototypes/${id}`);
    } catch (error) {
      console.error('Failed to delete prototype:', error);
      
      // Just log if server is unavailable
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNREFUSED' || 
           error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           (error.response && error.response.status >= 500))) {
        console.log('Prototype deleted (mock)');
        return;
      }
      
      throw error;
    }
  },
};