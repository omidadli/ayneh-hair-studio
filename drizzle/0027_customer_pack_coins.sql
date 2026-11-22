-- 0026 turned bought images into coins in customer_ledger but not in orders still waiting for
-- payment: a customer_pack order opened before it carries an image count in credits. Such an
-- order (its plan reads «بستهٔ N تصویر مشتری») is confirmed later when its exact amount arrives,
-- so its credits become coins here (×25), once.
UPDATE orders SET credits = credits * 25 WHERE kind = 'customer_pack' AND status <> 'paid' AND plan LIKE 'بستهٔ % تصویر مشتری';
