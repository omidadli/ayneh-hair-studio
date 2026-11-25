-- Campaign tab (owner, Nov 2026): the city/campaign a free signup and a reservation came from
-- (the ayneh_city cookie set by a short link, worker/cities.js). Visits are events_log rows
-- kind 'cvisit' (meta = campaign, visitor = anonymous browser id).
ALTER TABLE trials ADD COLUMN campaign TEXT NOT NULL DEFAULT '';
ALTER TABLE reservations ADD COLUMN campaign TEXT NOT NULL DEFAULT '';
