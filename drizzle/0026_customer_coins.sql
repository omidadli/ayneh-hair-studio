-- Regular customers move from images to coins (owner's plan): one image = 25 coins.
-- Every earlier ledger row (bought packs, referral gifts) keeps its value in coins.
UPDATE customer_ledger SET delta = delta * 25;
