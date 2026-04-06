import type { Build, BuildCategory } from "@/types/build";

type BuildFilters = {
  maxPrice?: number;
  category?: BuildCategory;
};

export function filterBuilds(builds: Build[], filters: BuildFilters) {
  return builds.filter((build) => {
    const priceOk = filters.maxPrice ? build.price <= filters.maxPrice : true;
    const categoryOk = filters.category ? build.category === filters.category : true;

    return priceOk && categoryOk;
  });
}
