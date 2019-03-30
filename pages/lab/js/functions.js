function degToRad(degrees) {
	return (degrees * Math.PI) / 180;
  }
  function RadToDeg(rad) {
	return (rad / Math.PI) * 180;
  }
  
  function Young(l1, l2, l3) {
	var f =
	  Math.pow(l1, 4.0) * SMatrix[0][0] +
	  2.0 * Math.pow(l1, 2.0) * Math.pow(l2, 2.0) * SMatrix[0][1] +
	  2.0 * Math.pow(l1, 2.0) * Math.pow(l3, 2.0) * SMatrix[0][2] +
	  Math.pow(l2, 4.0) * SMatrix[1][1] +
	  2.0 * Math.pow(l2, 2.0) * Math.pow(l3, 2.0) * SMatrix[1][2] +
	  Math.pow(l3, 4.0) * SMatrix[2][2] +
	  Math.pow(l2, 2.0) * Math.pow(l3, 2.0) * SMatrix[3][3] +
	  Math.pow(l1, 2.0) * Math.pow(l3, 2.0) * SMatrix[4][4] +
	  Math.pow(l1, 2.0) * Math.pow(l2, 2.0) * SMatrix[5][5];
	return 1.0 / f;
  }
  
  function lx(Theta, Phi) {
	return Math.sin(Theta) * Math.cos(Phi);
  }
  function ly(Theta, Phi) {
	return Math.sin(Theta) * Math.sin(Phi);
  }
  function lz(Theta) {
	return Math.cos(Theta);
  }
  
  function IsotropicYoung() {
	var N = 100; //360;
	var fSum = 0;
	for (var i = 0; i < N; i++) {
	  var Theta = (i * Math.PI) / N;
	  for (var j = 0; j < N; j++) {
		var Phi = (2.0 * j * Math.PI) / N;
		var l1 = lx(Theta, Phi);
		var l2 = ly(Theta, Phi);
		var l3 = lz(Theta);
		fSum = fSum + Young(l1, l2, l3) * Math.sin(Theta);
	  }
	}
	return (fSum * Math.PI) / (2.0 * Math.pow(N, 2.0));
  }
  
  function Jacobi(size, matrix, values, vectors) {
	var sm, g, tresh, theta, t, c, s, tau, h;
	var b = new Array(size + size);
	var rot = 0;
	var m_maxiter = 100;
	if (size == 0) return 0;
  
	for (var i = 0; i < size; i++) {
	  b[i + size] = 0.0;
	  b[i] = values[i] = matrix[i][i];
	  for (var j = 0; j < size; j++) {
		if (i == j) {
		  vectors[i][j] = 1.0;
		} else {
		  vectors[i][j] = 0.0;
		}
	  }
	}
  
	for (var i = 0; i < m_maxiter; i++) {
	  sm = 0.0;
	  for (var p = 0; p < size - 1; p++)
		for (var q = p + 1; q < size; q++) sm = sm + Math.abs(matrix[p][q]);
  
	  if (sm == 0) break;
  
	  if (i < 3) {
		tresh = (0.2 * sm) / (size * size);
	  } else {
		tresh = 0.0;
	  }
	  for (var p = 0; p < size - 1; p++) {
		for (var q = p + 1; q < size; q++) {
		  g = 1e12 * Math.abs(matrix[p][q]);
		  if (i >= 3 && Math.abs(values[p]) > g && Math.abs(values[q]) > g) {
			matrix[p][q] = 0.0;
		  } else {
			if (Math.abs(matrix[p][q]) > tresh) {
			  theta = (0.5 * (values[q] - values[p])) / matrix[p][q];
			  t = 1 / (Math.abs(theta) + Math.sqrt(1.0 + theta * theta));
			  if (theta < 0) {
				t = -t;
			  }
			  c = 1.0 / Math.sqrt(1.0 + t * t);
			  s = t * c;
			  tau = s / (1.0 + c);
			  h = t * matrix[p][q];
			  b[p + size] -= h;
			  b[q + size] += h;
			  values[p] -= h;
			  values[q] += h;
			  matrix[p][q] = 0.0;
			  for (var j = 0; j < p; j++) {
				g = matrix[j][p];
				h = matrix[j][q];
				matrix[j][p] = g - s * (h + g * tau);
				matrix[j][q] = h + s * (g - h * tau);
			  }
			  for (var j = p + 1; j < q; j++) {
				g = matrix[p][j];
				h = matrix[j][q];
				matrix[p][j] = g - s * (h + g * tau);
				matrix[j][q] = h + s * (g - h * tau);
			  }
			  for (var j = q + 1; j < size; j++) {
				g = matrix[p][j];
				h = matrix[q][j];
				matrix[p][j] = g - s * (h + g * tau);
				matrix[q][j] = h + s * (g - h * tau);
			  }
			  for (var j = 0; j < size; j++) {
				g = vectors[j][p];
				h = vectors[j][q];
				vectors[j][p] = g - s * (h + g * tau);
				vectors[j][q] = h + s * (g - h * tau);
			  }
			  rot++;
			}
		  }
		}
	  }
  
	  for (var p = 0; p < size; p++) {
		values[p] = b[p] += b[p + size];
		b[p + size] = 0.0;
	  }
	}
  }
  
  function CMatrixFormat(x, k) {
	if (Math.abs(x) < Math.pow(10, -k)) return "0";
	else return x.toFixed(k);
  }
  