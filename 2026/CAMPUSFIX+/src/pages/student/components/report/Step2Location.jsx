import React, { useMemo } from 'react';
import FormField from '../../../../components/ui/FormField';
import Select from '../../../../components/ui/Select';
import Input from '../../../../components/ui/Input';
import { CAMPUS } from '../../../../constants/campus';

export default function Step2Location({ form, onChange, errors }) {
  const buildings = CAMPUS.buildings;

  const currentBuilding = useMemo(() => {
    return buildings.find((b) => b.name === form.location.building) || buildings[0];
  }, [buildings, form.location.building]);

  const currentFloor = useMemo(() => {
    return (
      currentBuilding.floors.find((f) => f.label === form.location.floor) ||
      currentBuilding.floors[0]
    );
  }, [currentBuilding, form.location.floor]);

  function handleBuildingChange(buildingName) {
    const selectedB = buildings.find((b) => b.name === buildingName) || buildings[0];
    const defaultF = selectedB.floors[0];
    const defaultR = defaultF.rooms[0];
    onChange('location', {
      ...form.location,
      building: selectedB.name,
      floor: defaultF.label,
      room: defaultR,
    });
  }

  function handleFloorChange(floorLabel) {
    const selectedF = currentBuilding.floors.find((f) => f.label === floorLabel) || currentBuilding.floors[0];
    onChange('location', {
      ...form.location,
      floor: selectedF.label,
      room: selectedF.rooms[0],
    });
  }

  function handleRoomChange(roomName) {
    onChange('location', {
      ...form.location,
      room: roomName,
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">Hierarchical Spatial Coordinates</p>
        <p className="mt-0.5">Selecting accurate building, floor, and room parameters directs maintenance technicians without delays.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Building Block" required error={errors.building}>
          <Select
            value={form.location.building}
            onChange={(e) => handleBuildingChange(e.target.value)}
            options={buildings.map((b) => ({ value: b.name, label: b.name }))}
          />
        </FormField>

        <FormField label="Floor Level" required error={errors.floor}>
          <Select
            value={form.location.floor}
            onChange={(e) => handleFloorChange(e.target.value)}
            options={currentBuilding.floors.map((f) => ({ value: f.label, label: f.label }))}
          />
        </FormField>

        <FormField label="Room / Area" required error={errors.room}>
          <Select
            value={form.location.room}
            onChange={(e) => handleRoomChange(e.target.value)}
            options={currentFloor.rooms.map((r) => ({ value: r, label: r }))}
          />
        </FormField>
      </div>

      <FormField
        label="Nearby Landmark / Spot Note (Optional)"
        hint="e.g. Next to drinking water dispenser, 2nd window from right"
      >
        <Input
          value={form.location.landmark || ''}
          onChange={(e) =>
            onChange('location', { ...form.location, landmark: e.target.value })
          }
          placeholder="Specific location hints for the technician..."
          maxLength={150}
        />
      </FormField>
    </div>
  );
}
