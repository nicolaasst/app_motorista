import { base44 } from "@/api/base44Client";

// Resolve the current driver's profile + id used across authenticated pages.
// The first DriverProfile record is the active driver for this device.
export async function getDriver() {
  const profiles = await base44.entities.DriverProfile.list();
  const driver = profiles[0];
  const driverId = driver?.user_id || "seed-driver-lucas";
  return { driver, driverId };
}