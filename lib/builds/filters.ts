import type { Build, BuildCategory, BuildSourceType } from "@/types/build";

type BuildFilters = {
  category?: BuildCategory;
  sourceType?: BuildSourceType;
};

export function filterBuilds(builds: Build[], filters: BuildFilters) {
  return builds.filter((build) => {
    const categoryOk = filters.category ? build.category === filters.category : true;
    const sourceTypeOk = filters.sourceType ? build.sourceType === filters.sourceType : true;

    return categoryOk && sourceTypeOk;
  });
}
