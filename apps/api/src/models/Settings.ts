import { Schema, model } from 'mongoose';

export interface ISettings {
  adminEmail: string;
  adminUsername: string;
  adminPassword?: string;
  destinationEmail: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    adminEmail: { type: String, required: true, default: 'ochitm88@gmail.com' },
    adminUsername: { type: String, required: true, default: 'admin' },
    adminPassword: { type: String, required: true, default: 'sumakadmin2026' },
    destinationEmail: { type: String, default: 'ochitm88@gmail.com' },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

export const Settings = model<ISettings>('Settings', settingsSchema);

// Helper to get settings or initialize with defaults if not exists
export async function getSettings(): Promise<any> {
  let doc = await Settings.findOne();
  if (!doc) {
    doc = await Settings.create({});
  }
  return doc;
}
