import React from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { StationForm } from './station-form';

export function AddStationPage() {
  // This component will likely be a wrapper for the StationForm,
  // potentially with a more dedicated layout or additional instructions.
  
  // For now, it directly renders the StationForm in a "create" mode.

  const handleClose = () => {
    // In a real app, this would likely navigate back to the station list.
    // For this example, we can just log it.
    console.log("Form closed");
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Add New Station"
        subtitle="Register a new battery swap or charging station in the system."
      />
      
      {/* 
        The isOpen prop is always true here because this page is dedicated to adding a station.
        The onClose handler would need to be adapted for page navigation, e.g., using react-router.
      */}
      <div className="max-w-4xl mx-auto">
        <StationForm isOpen={true} onClose={handleClose} />
      </div>
    </div>
  );
}
