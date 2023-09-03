import { test as base } from '@playwright/test';

type DateRange = {
    startYear: Number;
    endYear: Number;
}

export const test = base.extend<{}, { dateRange: DateRange }>({
    dateRange: [async ({ browser }, use, workerInfo) => {
        await use({startYear: 2016, endYear: 2020} )
    }, { scope: 'worker' }]
});
