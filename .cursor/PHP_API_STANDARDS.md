BACKEND API STANDARDS:

1. JSON HEADER: Every PHP response must begin with:
   header('Content-Type: application/json');

2. ERROR REPORTING: Do not allow PHP to echo raw errors (which breaks JSON). Use try-catch blocks and return:
   echo json_encode(['error' => $e->getMessage()]);

3. INPUT HANDLING: Since Next.js sends JSON in the request body, use this to read data in PHP:
   $data = json_decode(file_get_contents('php://input'), true);

4. SECURITY: 
   - Sanitize all outputs to prevent XSS.
   - Use password_hash() for the 'Users' table.
   - All DB connections must use 'localhost'.