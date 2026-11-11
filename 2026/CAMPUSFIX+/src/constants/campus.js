/**
 * Campus physical layout: buildings → floors → rooms.
 * Used to populate location pickers in complaint forms.
 */
export const CAMPUS = {
  buildings: [
    {
      id: 'block-a',
      name: 'Block A — Academic',
      floors: [
        {
          id: 'a-f1',
          label: 'Ground Floor',
          rooms: ['A-001 (Reception)', "A-002 (Dean's Office)", 'A-003 (Seminar Hall 1)', 'A-004 (Seminar Hall 2)'],
        },
        {
          id: 'a-f2',
          label: 'First Floor',
          rooms: ['A-101', 'A-102', 'A-103', 'A-104', 'A-105 (Computer Lab)'],
        },
        {
          id: 'a-f3',
          label: 'Second Floor',
          rooms: ['A-201', 'A-202', 'A-203', 'A-204 (Library Annex)'],
        },
      ],
    },
    {
      id: 'block-b',
      name: 'Block B — Engineering',
      floors: [
        {
          id: 'b-f1',
          label: 'Ground Floor',
          rooms: ['B-001 (Workshop)', 'B-002 (Fabrication Lab)', 'B-003 (Store Room)'],
        },
        {
          id: 'b-f2',
          label: 'First Floor',
          rooms: ['B-101', 'B-102', 'B-103', 'B-104', 'B-105', 'B-106'],
        },
        {
          id: 'b-f3',
          label: 'Second Floor',
          rooms: ['B-201', 'B-202', 'B-203', 'B-204'],
        },
        {
          id: 'b-f4',
          label: 'Third Floor',
          rooms: ['B-301', 'B-302', 'B-303 (Research Lab)', 'B-304'],
        },
      ],
    },
    {
      id: 'block-c',
      name: 'Block C — Sciences',
      floors: [
        {
          id: 'c-f1',
          label: 'Ground Floor',
          rooms: ['C-001 (Physics Lab)', 'C-002 (Chemistry Lab)', 'C-003 (Biology Lab)'],
        },
        {
          id: 'c-f2',
          label: 'First Floor',
          rooms: ['C-101', 'C-102', 'C-103', 'C-104'],
        },
        {
          id: 'c-f3',
          label: 'Second Floor',
          rooms: ['C-201', 'C-202', 'C-203'],
        },
      ],
    },
    {
      id: 'hostel-boys',
      name: 'Boys Hostel — Sunrise',
      floors: [
        { id: 'hb-f1', label: 'Ground Floor', rooms: ['H-B-001 (Common Room)', 'H-B-002 (Warden Office)'] },
        { id: 'hb-f2', label: 'First Floor', rooms: ['H-B-101', 'H-B-102', 'H-B-103', 'H-B-104', 'H-B-105'] },
        { id: 'hb-f3', label: 'Second Floor', rooms: ['H-B-201', 'H-B-202', 'H-B-203', 'H-B-204'] },
      ],
    },
    {
      id: 'hostel-girls',
      name: 'Girls Hostel — Lotus',
      floors: [
        { id: 'hg-f1', label: 'Ground Floor', rooms: ['H-G-001 (Common Room)', 'H-G-002 (Warden Office)'] },
        { id: 'hg-f2', label: 'First Floor', rooms: ['H-G-101', 'H-G-102', 'H-G-103', 'H-G-104'] },
        { id: 'hg-f3', label: 'Second Floor', rooms: ['H-G-201', 'H-G-202', 'H-G-203'] },
      ],
    },
    {
      id: 'library',
      name: 'Central Library',
      floors: [
        { id: 'lib-f1', label: 'Ground Floor', rooms: ['LIB-001 (Issue Desk)', 'LIB-002 (Reading Hall A)'] },
        { id: 'lib-f2', label: 'First Floor', rooms: ['LIB-101 (Reading Hall B)', 'LIB-102 (Digital Section)'] },
      ],
    },
    {
      id: 'cafeteria',
      name: 'Student Cafeteria',
      floors: [
        { id: 'caf-f1', label: 'Ground Floor', rooms: ['CAF-001 (Main Hall)', 'CAF-002 (Kitchen)', 'CAF-003 (Storage)'] },
      ],
    },
    {
      id: 'sports',
      name: 'Sports Complex',
      floors: [
        { id: 'spt-f1', label: 'Ground Floor', rooms: ['SPT-001 (Indoor Court)', 'SPT-002 (Gym)', 'SPT-003 (Locker Room)'] },
      ],
    },
  ],
};
