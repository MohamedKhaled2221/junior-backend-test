# Challenge 2: Database Query Optimization

## SQL Query (PostgreSQL)

Fetch products priced between $50 and $200, ordered by price ascending, paginated at 10 per page.

```sql
SELECT id, name, category, price, quantity, created_at, updated_at
FROM products
WHERE price BETWEEN 50 AND 200
ORDER BY price ASC
LIMIT 10 OFFSET $1;  -- OFFSET = (page - 1) * 10
```

Example: page 3 → `OFFSET 20`.

**Supporting index:**
```sql
CREATE INDEX idx_products_price ON products (price);
```
A single B-tree index on `price` covers both the `WHERE price BETWEEN ...` range
filter and the `ORDER BY price ASC` — Postgres can walk the index in order
without a separate sort step.

---

## NoSQL Query (MongoDB)

Fetch products in the "Electronics" category, sorted by price descending, 5 per page.

```javascript
db.products
  .find({ category: "Electronics" })
  .sort({ price: -1 })
  .skip((page - 1) * 5)
  .limit(5);
```

**Supporting index:**
```javascript
db.products.createIndex({ category: 1, price: -1 });
```
A compound index matching the filter field first and the sort field second lets
MongoDB satisfy both the `find()` and the `sort()` from the index directly,
avoiding an in-memory sort (which also avoids hitting the 32MB sort-memory limit
on large result sets).

---

## Optimization for High-Traffic Scenarios

**1. Indexing**
- Add indexes that match actual query patterns (as above) rather than indexing
  every column — each extra index slows down writes (`INSERT`/`UPDATE`/`DELETE`)
  since it must be maintained too.
- For SQL, periodically run `EXPLAIN ANALYZE` on hot queries to confirm the
  planner is actually using the index and not falling back to a sequential scan.
- For MongoDB, use `.explain("executionStats")` to check `IXSCAN` is being used
  instead of `COLLSCAN`.

**2. Caching**
- Cache frequent read queries (e.g. "Electronics, page 1") in **Redis**, keyed
  by the filter + page combination (e.g. `products:electronics:page:1`), with a
  short TTL (30–60s is often enough to absorb traffic spikes).
- Invalidate (or let expire) the relevant cache keys whenever a product in that
  category is created, updated, or deleted, so stale data isn't served for long.
- Cache-aside pattern: check Redis first → on a miss, query the DB → populate
  the cache → return the result.

**3. Pagination strategy**
- Offset-based pagination (`OFFSET`/`skip`) gets slower on deep pages because
  the database still has to scan and discard all the skipped rows.
- For high-traffic, deep-pagination scenarios, prefer **keyset (cursor) pagination**:
  instead of `OFFSET 200`, carry the last seen value forward, e.g.
  `WHERE price > $lastPrice ORDER BY price ASC LIMIT 10`. This stays fast
  regardless of how deep the user pages.

**4. Query shape**
- Select only the fields actually needed (`SELECT id, name, price ...` instead
  of `SELECT *`) to reduce payload size and I/O.
- Avoid `COUNT(*)` on every request if an approximate or cached total is good
  enough for pagination UI.

**5. Scaling beyond a single instance**
- Read replicas for read-heavy endpoints like product listing, keeping writes
  on the primary.
- Connection pooling (e.g. `pgBouncer` for Postgres, Mongoose's built-in pool)
  so the app doesn't exhaust DB connections under load.
- For very large datasets, consider sharding MongoDB on `category` if access
  patterns are strongly category-partitioned.
