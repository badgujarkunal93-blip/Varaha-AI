const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testFpoWorkflow() {
  console.log('🏢 Starting FPO Organization Workflow Test Suite...\n');

  // 1. Test Organization Analytics
  console.log('1️⃣ Fetching Organization Analytics...');
  const analyticsRes = await request('GET', '/api/organization/analytics');
  console.log('   Analytics:', analyticsRes.data.analytics);
  if (analyticsRes.status !== 200 || !analyticsRes.data.analytics.total_farmers) {
    throw new Error('Failed to retrieve FPO analytics');
  }

  // 2. Register New Farmer
  console.log('\n2️⃣ Registering new farmer (Tukaram Gaikwad)...');
  const farmerId = `farmer-test-${Date.now()}`;
  const farmerRes = await request('POST', '/api/farmers', {
    id: farmerId,
    org_id: 'org-pune-baramati',
    name: 'Tukaram Gaikwad',
    contact: '+91 98210 99887',
    location: 'Supa Village, Baramati, Pune',
    crop: 'Wheat (HD 2967)',
    acres: 9.0
  });
  console.log('   Farmer Created:', farmerRes.data.data.id, farmerRes.data.data.name);

  // 3. Create Associated Farm
  console.log('\n3️⃣ Creating Farm entity for farmer...');
  const farmId = `farm-test-${Date.now()}`;
  const farmRes = await request('POST', '/api/farms', {
    id: farmId,
    org_id: 'org-pune-baramati',
    farmer_id: farmerId,
    name: 'Tukaram Supa Holdings',
    survey_number: '124/3B',
    village: 'Supa Village',
    taluka: 'Baramati',
    total_ha: 3.6
  });
  console.log('   Farm Created:', farmRes.data.data.id, farmRes.data.data.survey_number);

  // 4. Create Zone under Farm
  console.log('\n4️⃣ Creating Zone under Farm...');
  const zoneId = `zone-test-${Date.now()}`;
  const zoneRes = await request('POST', '/api/zones', {
    id: zoneId,
    org_id: 'org-pune-baramati',
    farm_id: farmId,
    farmer_id: farmerId,
    name: 'Plot S1 (Supa)',
    crop: 'Wheat',
    growth_stage: 'Tillering',
    lat: 18.158,
    lng: 74.568,
    area_ha: 3.6,
    device_id: 'SMP-9099'
  });
  console.log('   Zone Created:', zoneRes.data.data.id, zoneRes.data.data.name);

  // 5. Register Device under Zone
  console.log('\n5️⃣ Registering IoT Device under Zone...');
  const devRes = await request('POST', '/api/devices', {
    id: 'SMP-9099',
    org_id: 'org-pune-baramati',
    farm_id: farmId,
    farmer_id: farmerId,
    zone_id: zoneId,
    type: 'ESP32_SOIL_CANOPY_NODE',
    status: 'ONLINE',
    battery_pct: 95,
    firmware: 'v2.2.0'
  });
  console.log('   Device Registered:', devRes.data.data.id);

  // 6. Test Alert Assignment to Field Officer
  console.log('\n6️⃣ Assigning Extension Officer to Alert (alt-1)...');
  const alertRes = await request('POST', '/api/alerts/alt-1/assign-officer', {
    officer_id: 'exp-2'
  });
  console.log('   Alert Updated:', alertRes.data.alert.id, '-> Assigned Officer:', alertRes.data.alert.assigned_officer_name);
  if (alertRes.data.alert.status !== 'INSPECTION_ASSIGNED') {
    throw new Error('Alert status was not updated to INSPECTION_ASSIGNED');
  }

  // 7. Test Maintenance Ticket Assignment to Technician
  const allTickets = await request('GET', '/api/maintenance_tickets');
  const targetTicket = (allTickets.data.data && allTickets.data.data[0]) || { id: 'tkt-01' };
  console.log(`\n7️⃣ Assigning Technician to Ticket (${targetTicket.id})...`);
  const tktAssignRes = await request('POST', `/api/maintenance_tickets/${targetTicket.id}/assign-technician`, {
    technician_id: 'tech-1'
  });
  console.log('   Ticket Updated:', tktAssignRes.data.ticket.id, '-> Assigned Technician:', tktAssignRes.data.ticket.assigned_technician_name);

  // 8. Test Ticket Resolution
  console.log(`\n8️⃣ Resolving Maintenance Ticket (${targetTicket.id})...`);
  const tktResolveRes = await request('POST', `/api/maintenance_tickets/${targetTicket.id}/update-status`, {
    status: 'RESOLVED',
    notes: 'Solar LiFePO4 battery recalibrated and reconnected.'
  });
  console.log('   Ticket Resolved:', tktResolveRes.data.ticket.status, 'at:', tktResolveRes.data.ticket.resolved_at);

  console.log('\n=======================================================');
  console.log('🎉 ALL FPO ORGANIZATION WORKFLOW TESTS PASSED 100%');
  console.log('=======================================================');
}

testFpoWorkflow().catch((err) => {
  console.error('❌ FPO Workflow Test Failed:', err.message);
  process.exit(1);
});
