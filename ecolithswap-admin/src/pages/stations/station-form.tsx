import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { Checkbox } from '../../components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { MapPin, Upload, X } from 'lucide-react'
import { useCreateStation, useUpdateStation } from '../../hooks/useStations'
import { Station } from '../../types'
import toast from 'react-hot-toast'

interface StationFormProps {
  station?: Station
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  address: string
  latitude: number | ''
  longitude: number | ''
  station_type: 'swap' | 'charge' | 'both'
  total_slots: number | ''
  operating_hours: string
  contact_info: string
  manager_id: string
  accepts_plastic: boolean
  self_service: boolean
  image: File | null
}

interface FormErrors {
  [key: string]: string
}

export function StationForm({ station, onClose, onSuccess }: StationFormProps) {
  const [formData, setFormData] = useState<FormData>({
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
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createStationMutation = useCreateStation()
  const updateStationMutation = useUpdateStation()

  const isEditing = !!station

  // Initialize form data when editing
  useEffect(() => {
    if (station) {
      setFormData({
        name: station.name,
        address: station.address,
        latitude: station.latitude,
        longitude: station.longitude,
        station_type: station.station_type,
        total_slots: station.total_slots,
        operating_hours: station.operating_hours || '24/7',
        contact_info: station.contact_info || '',
        manager_id: station.manager_id || '',
        accepts_plastic: station.accepts_plastic,
        self_service: station.self_service,
        image: null,
      })
      if (station.image_url) {
        setImagePreview(station.image_url)
      }
    }
  }, [station])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Station name is required'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (formData.latitude === '' || isNaN(Number(formData.latitude))) {
      newErrors.latitude = 'Valid latitude is required'
    } else if (Number(formData.latitude) < -90 || Number(formData.latitude) > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90'
    }

    if (formData.longitude === '' || isNaN(Number(formData.longitude))) {
      newErrors.longitude = 'Valid longitude is required'
    } else if (Number(formData.longitude) < -180 || Number(formData.longitude) > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180'
    }

    if (formData.total_slots === '' || Number(formData.total_slots) < 1) {
      newErrors.total_slots = 'Total slots must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setFormData(prev => ({ ...prev, image: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }))
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
      // Add all form fields to FormData
      formDataToSend.append('name', formData.name)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('latitude', String(formData.latitude))
      formDataToSend.append('longitude', String(formData.longitude))
      formDataToSend.append('station_type', formData.station_type)
      formDataToSend.append('total_slots', String(formData.total_slots))
      formDataToSend.append('operating_hours', formData.operating_hours)
      formDataToSend.append('contact_info', formData.contact_info)
      formDataToSend.append('accepts_plastic', String(formData.accepts_plastic))
      formDataToSend.append('self_service', String(formData.self_service))
      
      if (formData.manager_id) {
        formDataToSend.append('manager_id', formData.manager_id)
      }
      
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      if (isEditing) {
        await updateStationMutation.mutateAsync({
          id: station.id,
          data: formDataToSend
        })
      } else {
        await createStationMutation.mutateAsync(formDataToSend)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving station:', error)
      toast.error(error.response?.data?.error || 'Failed to save station')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }))
        toast.success('Location updated successfully')
      },
      (error) => {
        toast.error('Unable to retrieve your location')
        console.error('Geolocation error:', error)
      }
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Station' : 'Create New Station'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the station information below.'
              : 'Fill out the information below to create a new charging station.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Station Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Downtown Mall Station"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="station_type">Station Type *</Label>
                  <Select value={formData.station_type} onValueChange={(value) => handleInputChange('station_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="swap">Battery Swap Only</SelectItem>
                      <SelectItem value="charge">Charging Only</SelectItem>
                      <SelectItem value="both">Both Swap & Charge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter the full address of the station"
                  className={errors.address ? 'border-red-500' : ''}
                  rows={2}
                />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
              </div>

              <div>
                <Label htmlFor="total_slots">Total Battery Slots *</Label>
                <Input
                  id="total_slots"
                  type="number"
                  min="1"
                  value={formData.total_slots}
                  onChange={(e) => handleInputChange('total_slots', parseInt(e.target.value) || '')}
                  placeholder="e.g., 20"
                  className={errors.total_slots ? 'border-red-500' : ''}
                />
                {errors.total_slots && <p className="text-sm text-red-600 mt-1">{errors.total_slots}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Location Coordinates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Enter the exact GPS coordinates for the station</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                >
                  Use Current Location
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || '')}
                    placeholder="e.g., -1.286389"
                    className={errors.latitude ? 'border-red-500' : ''}
                  />
                  {errors.latitude && <p className="text-sm text-red-600 mt-1">{errors.latitude}</p>}
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || '')}
                    placeholder="e.g., 36.817223"
                    className={errors.longitude ? 'border-red-500' : ''}
                  />
                  {errors.longitude && <p className="text-sm text-red-600 mt-1">{errors.longitude}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operational Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operational Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="operating_hours">Operating Hours</Label>
                  <Input
                    id="operating_hours"
                    value={formData.operating_hours}
                    onChange={(e) => handleInputChange('operating_hours', e.target.value)}
                    placeholder="e.g., 6:00 AM - 10:00 PM"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_info">Contact Information</Label>
                  <Input
                    id="contact_info"
                    value={formData.contact_info}
                    onChange={(e) => handleInputChange('contact_info', e.target.value)}
                    placeholder="Phone or email for support"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accepts_plastic"
                    checked={formData.accepts_plastic}
                    onCheckedChange={(checked) => handleInputChange('accepts_plastic', checked)}
                  />
                  <Label htmlFor="accepts_plastic" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Accepts plastic waste for recycling
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="self_service"
                    checked={formData.self_service}
                    onCheckedChange={(checked) => handleInputChange('self_service', checked)}
                  />
                  <Label htmlFor="self_service" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Self-service station (no staff required)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Station Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Station Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Station preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#8BC34A] hover:bg-[#7CB342] text-white"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Station' : 'Create Station'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}