import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { MapPin, Upload, X } from 'lucide-react';
import { useCreateStation, useUpdateStation } from '../../hooks/useStations';
import { Station } from '../../types';
import toast from 'react-hot-toast';

interface StationFormProps {
  isOpen: boolean;
  onClose: () => void;
  station?: Station | null;
}

// Using a more flexible interface for form data
interface FormData {
  [key: string]: any;
  name: string;
  address: string;
  latitude: number | '';
  longitude: number | '';
  station_type: 'swap' | 'charge' | 'both';
  total_slots: number | '';
  operating_hours: string;
  contact_info: string;
  manager_id: string;
  accepts_plastic: boolean;
  self_service: boolean;
  image: File | null;
}

interface FormErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  station_type: 'swap',
  total_slots: '',
  operating_hours: '24/7',
  contact_info: '',
  manager_id: '',
  accepts_plastic: false,
  self_service: true,
  image: null,
};

// Mock managers data - replace with API call in a real app
const managers = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Peter Jones' },
];

export function StationForm({ isOpen, onClose, station }: StationFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const createStationMutation = useCreateStation();
  const updateStationMutation = useUpdateStation();
  
  const isSubmitting = createStationMutation.isPending || updateStationMutation.isPending;
  const isEditing = !!station;

  useEffect(() => {
    if (isOpen) {
      if (station) {
        setFormData({
          name: station.name || '',
          address: station.address || '',
          latitude: station.latitude || '',
          longitude: station.longitude || '',
          station_type: station.station_type || 'swap',
          total_slots: station.total_slots || '',
          operating_hours: station.operating_hours || '24/7',
          contact_info: station.contact_info || '',
          manager_id: station.manager_id || '',
          accepts_plastic: station.accepts_plastic || false,
          self_service: station.self_service || true,
          image: null, // Image is handled separately
        });
        setImagePreview(station.image_url || null);
      } else {
        setFormData(initialFormData);
        setImagePreview(null);
      }
      setErrors({});
    }
  }, [station, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Station name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (formData.latitude === '' || isNaN(Number(formData.latitude))) {
      newErrors.latitude = 'Valid latitude is required';
    } else if (Math.abs(Number(formData.latitude)) > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (formData.longitude === '' || isNaN(Number(formData.longitude))) {
      newErrors.longitude = 'Valid longitude is required';
    } else if (Math.abs(Number(formData.longitude)) > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }
    if (formData.total_slots === '' || Number(formData.total_slots) < 1) {
      newErrors.total_slots = 'Total slots must be at least 1';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        toast.error('Please select an image file under 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(isEditing ? station?.image_url || null : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = new FormData();
    // Append all form fields to FormData object
    Object.keys(formData).forEach(key => {
      if (key === 'image' && formData.image) {
        data.append('image', formData.image);
      } else if (formData[key] !== null && formData[key] !== '') {
        data.append(key, String(formData[key]));
      }
    });

    const mutation = isEditing
      ? updateStationMutation.mutateAsync({ id: station!.id, data })
      : createStationMutation.mutateAsync(data);

    toast.promise(mutation, {
      loading: isEditing ? 'Updating station...' : 'Creating station...',
      success: () => {
        onClose();
        return `Station ${isEditing ? 'updated' : 'created'} successfully!`;
      },
      error: (err: any) => err.response?.data?.error || 'Failed to save station',
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        toast.success('Location updated successfully');
      },
      () => toast.error('Unable to retrieve your location')
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Station' : 'Create New Station'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the station details.' : 'Fill in the form to add a new station.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form sections using Card component */}
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Station Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g., Downtown Mall Station" className={errors.name ? 'border-red-500' : ''}/>
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="station_type">Station Type *</Label>
                  <Select value={formData.station_type} onValueChange={(value) => handleInputChange('station_type', value)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="swap">Battery Swap</SelectItem>
                      <SelectItem value="charge">Charging</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="Enter full address" className={errors.address ? 'border-red-500' : ''} rows={2}/>
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="total_slots">Total Slots *</Label>
                    <Input id="total_slots" type="number" value={formData.total_slots} onChange={(e) => handleInputChange('total_slots', e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="e.g., 12" className={errors.total_slots ? 'border-red-500' : ''} />
                    {errors.total_slots && <p className="text-sm text-red-600 mt-1">{errors.total_slots}</p>}
                </div>
                <div>
                    <Label htmlFor="manager_id">Assigned Manager</Label>
                    <Select value={formData.manager_id} onValueChange={(value) => handleInputChange('manager_id', value)}>
                        <SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger>
                        <SelectContent>
                        {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center"><MapPin className="h-4 w-4 mr-2"/>Location</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Enter GPS coordinates</p>
                    <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation}>Use Current Location</Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="latitude">Latitude *</Label>
                        <Input id="latitude" type="number" step="any" value={formData.latitude} onChange={(e) => handleInputChange('latitude', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="e.g., -1.286389" className={errors.latitude ? 'border-red-500' : ''} />
                        {errors.latitude && <p className="text-sm text-red-600 mt-1">{errors.latitude}</p>}
                    </div>
                    <div>
                        <Label htmlFor="longitude">Longitude *</Label>
                        <Input id="longitude" type="number" step="any" value={formData.longitude} onChange={(e) => handleInputChange('longitude', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="e.g., 36.817223" className={errors.longitude ? 'border-red-500' : ''} />
                        {errors.longitude && <p className="text-sm text-red-600 mt-1">{errors.longitude}</p>}
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader><CardTitle>Operational Settings</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                {/* Operating Hours, Contact, Checkboxes */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="accepts_plastic" checked={formData.accepts_plastic} onCheckedChange={(checked) => handleInputChange('accepts_plastic', !!checked)} />
                  <Label htmlFor="accepts_plastic">Accepts plastic waste</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="self_service" checked={formData.self_service} onCheckedChange={(checked) => handleInputChange('self_service', !!checked)} />
                  <Label htmlFor="self_service">Self-service station</Label>
                </div>
             </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Station Image</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Image Upload */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag & drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                  </label>
                </div>
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    <img src={imagePreview} alt="Station preview" className="w-full h-full object-cover"/>
                    <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"><X className="h-4 w-4" /></button>
                  </div>
                )}
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Station' : 'Create Station')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
