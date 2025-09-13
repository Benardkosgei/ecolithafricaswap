import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useCreateBattery, useUpdateBattery } from '../../hooks/useBatteries';
import { useStations } from '../../hooks/useStations';

interface BatteryFormProps {
  isOpen: boolean;
  onClose: () => void;
  battery?: any | null;
}

const batterySchema = z.object({
  battery_code: z.string().min(1, 'Code is required'),
  serial_number: z.string().min(1, 'Serial is required'),
  model: z.string().min(1, 'Model is required'),
  manufacturer: z.string().optional(),
  capacity_kwh: z.coerce.number().positive(),
  status: z.enum(['available', 'rented', 'charging', 'maintenance', 'retired']).optional(),
  health_status: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  current_station_id: z.string().optional(),
  notes: z.string().optional(),
  image: z.any().optional(),
});

export function BatteryForm({ isOpen, onClose, battery }: BatteryFormProps) {
  const isEditing = !!battery;
  const createMutation = useCreateBattery();
  const updateMutation = useUpdateBattery();
  const { data: stationsResponse } = useStations(1, 100); // Fetch stations for dropdown

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(batterySchema),
    defaultValues: isEditing ? battery : { status: 'available', health_status: 'excellent', capacity_kwh: 1.5 },
  });

  useEffect(() => {
    if (isOpen) {
      reset(isEditing ? battery : { battery_code: '', serial_number: '', model: '', status: 'available', health_status: 'excellent', capacity_kwh: 1.5 });
    }
  }, [isOpen, isEditing, battery, reset]);

  const onSubmit = (data: z.infer<typeof batterySchema>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof FileList) {
        formData.append(key, value[0]);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    const mutation = isEditing
      ? updateMutation.mutateAsync({ id: battery.id, formData })
      : createMutation.mutateAsync(formData);

    toast.promise(mutation, {
      loading: isEditing ? 'Updating battery...' : 'Creating battery...',
      success: () => { onClose(); return `Battery ${isEditing ? 'updated' : 'created'}!`; },
      error: (err: any) => err.response?.data?.error || 'An error occurred.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEditing ? 'Edit Battery' : 'Add Battery'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Code</Label><Input {...register('battery_code')} />{errors.battery_code && <p className='text-red-500'>{errors.battery_code.message}</p>}</div>
            <div><Label>Serial</Label><Input {...register('serial_number')} />{errors.serial_number && <p className='text-red-500'>{errors.serial_number.message}</p>}</div>
            <div><Label>Model</Label><Input {...register('model')} />{errors.model && <p className='text-red-500'>{errors.model.message}</p>}</div>
            <div><Label>Manufacturer</Label><Input {...register('manufacturer')} /></div>
            <div><Label>Capacity (kWh)</Label><Input type="number" step="0.1" {...register('capacity_kwh')} />{errors.capacity_kwh && <p className='text-red-500'>{errors.capacity_kwh.message}</p>}</div>
          </div>
          <Controller name="status" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="charging">Charging</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            )} />
          <Controller name="current_station_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                <SelectTrigger><SelectValue placeholder="Assign to Station" /></SelectTrigger>
                <SelectContent>
                  {stationsResponse?.stations.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          <div><Label>Notes</Label><Input {...register('notes')} /></div>
          <div><Label>Image</Label><Input type="file" {...register('image')} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEditing ? 'Save Changes' : 'Create Battery'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
