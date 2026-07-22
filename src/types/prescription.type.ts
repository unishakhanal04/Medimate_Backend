export interface IPrescription {
  _id: string;
  userId: string;
  title: string;
  doctorName: string;
  hospital?: string;
  prescriptionDate: Date;
  expiryDate?: Date;
  diagnosis?: string;
  reviewDate?: Date;
  medicines: string[];
  notes?: string;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrescriptionDTO {
  title: string;
  doctorName: string;
  hospital?: string;
  prescriptionDate: string;
  expiryDate?: string;
  diagnosis?: string;
  reviewDate?: string;
  medicines?: string[];
  notes?: string;
  attachmentUrl?: string;
}

export interface UpdatePrescriptionDTO {
  title?: string;
  doctorName?: string;
  hospital?: string;
  prescriptionDate?: string;
  expiryDate?: string;
  diagnosis?: string;
  reviewDate?: string;
  medicines?: string[];
  notes?: string;
  attachmentUrl?: string;
}
