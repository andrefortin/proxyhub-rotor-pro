# E2E Test: CSV Export Button Text Consistency

Test CSV export button text consistency between available tables and query results sections in the Natural Language SQL Interface application.

## User Story

As a user
I want consistent labeling on CSV export buttons across the interface
So that the UI is uniform and intuitive

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial state (empty tables)
3. **Verify** the page title is "Natural Language SQL Interface"
4. Click "Upload Data" to open the modal
5. Click the "Products" sample data button to upload products.csv
6. **Verify** the "products" table appears in Available Tables
7. **Verify** the export button text for the products table is exactly '📊 CSV' (inspect element textContent)
8. Take a screenshot of the table with export button (highlight text)

9. Enter query: "SELECT * FROM products LIMIT 5"
10. Click "Query" button
11. **Verify** query results table appears
12. **Verify** the export button text in query results header is exactly '📊 CSV' (inspect element textContent; before fix it was '📊 CSV Export')
13. Take a screenshot of query results with export button (highlight text)

14. Click the table export button
15. **Verify** a CSV file named 'products_export.csv' is downloaded
16. Click the query results export button
17. **Verify** a CSV file named 'query_results.csv' is downloaded with 5 rows of data

18. Take a screenshot of the final state showing both sections

## Success Criteria

- Both export buttons display identical text '📊 CSV'
- Button icons and positioning are consistent (icon left of text)
- Export functionality works without errors for both table and query results
- No layout shifts or styling regressions from text change
- CSV files download correctly with expected data
- 4 screenshots capture: initial, table button, query button, final state