import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authAPI, userProfilesAPI, Customer } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Camera, User, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

export function ProfileSettings() {
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const { data: user, isLoading } = useQuery<Customer>({
    queryKey: ['profile'],
    queryFn: () => authAPI.getProfile().then((res) => res.data),
  });

  const { control, handleSubmit } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
        name: user?.name ?? '',
        email: user?.email ?? '',
    }
  });

  const updateProfileMutation = useMutation<Customer, Error, FormData>({
    mutationFn: (data) => userProfilesAPI.updateProfile(user!.id, data).then((res) => res.data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarFile(null);
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal details here.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex items-center">
                <Button asChild variant="outline">
                    <label htmlFor="avatar-upload">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Picture
                    </label>
                </Button>
                <input id="avatar-upload" type="file" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} accept="image/*" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="font-medium">Full Name</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input {...field} placeholder="Your name" className="pl-10"/>
                  </div>
                </div>
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="font-medium">Email</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input {...field} placeholder="Your email" className="pl-10"/>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
