import fs from 'fs';

let content = fs.readFileSync('src/renderer25d/boardRenderer.ts', 'utf8');

const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

const oldCornerLogic = `      if (isCorner) {
        // 4 Ô GÓC: biển song song cạnh ngoài gần người xem nhất của ô góc, đặt sát mép ngoài
        if (tile.id === 0) {
          // Nam - Xuất Phát: cạnh đáy Nam (ngang)
          edgeAngle = 0;
          sideAngle = Math.PI / 2;
          posX = geo.center.x;
          posY = geo.outerStart.y - 14;
          tileWidth = 110;
        } else if (tile.id === 10) {
          // Tây - Trại Giam: song song cạnh Tây Nam
          edgeAngle = HOMOGRAPHY_ANGLE_AXIS_A;
          sideAngle = HOMOGRAPHY_ANGLE_AXIS_B;
          posX = geo.outerStart.x + 28;
          posY = geo.outerStart.y + 12;
          tileWidth = 90;
        } else if (tile.id === 20) {
          // Bắc - Quán Trà Đá: song song cạnh Bắc
          edgeAngle = 0;
          sideAngle = Math.PI / 2;
          posX = geo.center.x;
          posY = geo.outerStart.y + 18;
          tileWidth = 85;
        } else {
          // Đông - Vào Tù: song song cạnh Đông Nam
          edgeAngle = HOMOGRAPHY_ANGLE_AXIS_B;
          sideAngle = HOMOGRAPHY_ANGLE_AXIS_A;
          posX = geo.outerStart.x - 28;
          posY = geo.outerStart.y + 12;
          tileWidth = 90;
        }
      }`;

const newCornerLogic = `      if (isCorner) {
        // 4 Ô GÓC: biển tên đặt ở mép ngoài ô, thấp hơn và không che nhân vật / công trình góc
        if (tile.id === 0) {
          // Nam - Xuất Phát: đặt ở mép ngoài ô (phía dưới), thấp hơn để không che 4 nhân vật đứng trên ô
          edgeAngle = 0;
          sideAngle = Math.PI / 2;
          posX = geo.center.x;
          posY = geo.outerStart.y + 24;
          tileWidth = 110;
        } else if (tile.id === 10) {
          // Tây - Trại Giam: đặt ở mép ngoài ô góc phía Tây, không đè lên công trình Trại Giam
          edgeAngle = HOMOGRAPHY_ANGLE_AXIS_A;
          sideAngle = HOMOGRAPHY_ANGLE_AXIS_B;
          posX = geo.outerStart.x - 24;
          posY = geo.outerStart.y + 20;
          tileWidth = 90;
        } else if (tile.id === 20) {
          // Bắc - Quán Trà Đá: đặt ở mép ngoài ô phía Bắc
          edgeAngle = 0;
          sideAngle = Math.PI / 2;
          posX = geo.center.x;
          posY = geo.outerStart.y - 12;
          tileWidth = 85;
        } else {
          // Đông - Vào Tù: đặt ở mép ngoài ô góc phía Đông, không đè lên công trình Vào Tù
          edgeAngle = HOMOGRAPHY_ANGLE_AXIS_B;
          sideAngle = HOMOGRAPHY_ANGLE_AXIS_A;
          posX = geo.outerStart.x + 24;
          posY = geo.outerStart.y + 20;
          tileWidth = 90;
        }
      }`;

if (!content.includes(oldCornerLogic)) {
  console.error('Could not find oldCornerLogic in boardRenderer.ts');
  process.exit(1);
}

content = content.replace(oldCornerLogic, newCornerLogic);

if (isCRLF) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('src/renderer25d/boardRenderer.ts', content, 'utf8');
console.log('Successfully patched corner labels in boardRenderer.ts');
