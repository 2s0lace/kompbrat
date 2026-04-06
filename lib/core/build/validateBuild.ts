import type { BuildPartSelection, BuildValidationResult } from "@/lib/core/types";

export function validateBuild(build: BuildPartSelection, budget: number, totalPrice: number): BuildValidationResult {
  const issues: BuildValidationResult["issues"] = [];
  const compatibleSocket = build.cpu.socket === build.motherboard.socket;
  const compatibleRam = build.motherboard.ramType === build.ram.ramType;
  const caseFitsBoard = build.case.supportedFormFactors.includes(build.motherboard.formFactor);
  const estimatedPowerDraw = build.cpu.powerW + build.gpu.powerW + 120;
  const psuHeadroomW = build.psu.wattage - estimatedPowerDraw;

  if (!compatibleSocket) {
    issues.push({ code: "socket_mismatch", severity: "error", message: "CPU i płyta mają niezgodny socket." });
  }

  if (!compatibleRam) {
    issues.push({ code: "ram_mismatch", severity: "error", message: "RAM nie pasuje do wybranej płyty." });
  }

  if (!caseFitsBoard) {
    issues.push({ code: "case_fit", severity: "error", message: "Obudowa nie wspiera formatu płyty." });
  }

  if (psuHeadroomW < 120) {
    issues.push({ code: "psu_headroom", severity: psuHeadroomW < 60 ? "error" : "warning", message: "Zasilacz ma zbyt mały zapas mocy." });
  }

  if (totalPrice > budget) {
    issues.push({ code: "budget_over", severity: "error", message: "Build nie mieści się w budżecie." });
  }

  if (build.psu.qualityScore < 55) {
    issues.push({ code: "psu_quality", severity: "warning", message: "PSU jest raczej budżetowy, nie mocny jakościowo." });
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
    totalPrice,
    estimatedPowerDraw,
    psuHeadroomW,
  };
}
