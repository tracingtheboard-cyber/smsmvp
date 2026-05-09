import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { mockGrades, mockStudents, mockModules } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get('moduleId');
  const intakeId = searchParams.get('intakeId');

  const currentModule = mockModules.find(m => m.id === moduleId);
  const intakeStudents = mockStudents.filter(s => s.intakeId === intakeId);

  const data = intakeStudents.length > 0 ? intakeStudents.map(s => {
    const existingGrade = mockGrades.find(g => g.studentId === s.id && g.moduleId === moduleId);
    return {
      'Student ID': s.id,
      'Name': `${s.firstName} ${s.lastName}`,
      'Score': existingGrade?.score || '',
      'Notes': ''
    };
  }) : [{ 'Student ID': 'No students found', 'Name': '', 'Score': '', 'Notes': '' }];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Grades');
  
  // Create buffer for Node.js environment
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  const filename = `Grades_${currentModule?.code || 'Module'}_${intakeId || 'Intake'}.xlsx`;

  // Serve the file with strict HTTP headers to force download and filename
  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });
}
