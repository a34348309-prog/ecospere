import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// AUTH Schemas
// ─────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─────────────────────────────────────────────────────────────
// LOCATION Schemas
// ─────────────────────────────────────────────────────────────
export const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ─────────────────────────────────────────────────────────────
// CARBON BILL Schemas
// ─────────────────────────────────────────────────────────────
export const carbonBillUploadSchema = z.object({
  billType: z.enum(["electricity", "gas", "water"]),
});

export const carbonBillManualSchema = z.object({
  billType: z.enum(["electricity", "gas", "water"]),
  totalUnits: z.number().positive("Total units must be positive"),
  billDate: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// EVENT Schemas
// ─────────────────────────────────────────────────────────────
export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  organizer: z.string().min(2),
  date: z.string(),
  time: z.string(),
  locationName: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  maxParticipants: z.number().int().positive().optional().default(50),
});

// ─────────────────────────────────────────────────────────────
// VERIFY ATTENDANCE Schemas
// ─────────────────────────────────────────────────────────────
export const verifyAttendanceSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ─────────────────────────────────────────────────────────────
// PLANTATION EVENT Schemas
// ─────────────────────────────────────────────────────────────
export const createPlantationEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  organizerName: z.string().min(2),
  date: z.string(),
  locationName: z.string(),
  treesGoal: z.number().int().positive().optional().default(100),
  // GeoJSON polygon coordinates: array of [lng, lat] pairs
  boundary: z
    .array(z.array(z.number()).length(2))
    .min(4, "Polygon must have at least 4 points (closed ring)"),
});

// ─────────────────────────────────────────────────────────────
// ACTIVITY LOG Schemas
// ─────────────────────────────────────────────────────────────
export const logActivitySchema = z.object({
  category: z.enum(["transport", "food", "energy", "waste"]),
  activity: z.string().min(2),
  value: z.number().positive("Value must be positive"),
  date: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// ECO PLAN Schemas
// ─────────────────────────────────────────────────────────────
export const generateEcoPlanSchema = z.object({
  commuteDistance: z.number().min(0, "Commute distance must be 0 or more"),
  vehicleType: z.enum(["car", "bike", "public_transport", "none"]),
  monthlyElectricity: z.number().min(0, "Electricity must be 0 or more"),
  age: z.number().int().min(10).max(120),
  city: z.string().min(1, "City is required"),
  dietaryPreference: z.enum([
    "non_vegetarian",
    "vegetarian",
    "vegan",
    "flexitarian",
  ]),
  meatMealsPerWeek: z.number().int().min(0).max(21),
  hasGarden: z.boolean(),
  homeOwnership: z.enum(["own", "rent"]),
  householdSize: z.number().int().min(1).max(20),
  acUsageHours: z.number().min(0).max(24),
  wasteRecycling: z.enum(["always", "sometimes", "never"]),
  monthlyGroceryBill: z.number().min(0),
  willingnessChangeDiet: z.number().int().min(1).max(5),
  willingnessPublicTransport: z.number().int().min(1).max(5),
  timeAvailability: z.enum(["low", "medium", "high"]),
});

export const updateProgressSchema = z.object({
  actionId: z.string().uuid("Invalid action ID"),
  isCompleted: z.boolean(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type VerifyAttendanceInput = z.infer<typeof verifyAttendanceSchema>;
export type CreatePlantationEventInput = z.infer<
  typeof createPlantationEventSchema
>;
export type LogActivityInput = z.infer<typeof logActivitySchema>;
export type GenerateEcoPlanInput = z.infer<typeof generateEcoPlanSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
