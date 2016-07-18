<?php

  $TILE_WIDTH = 16;
  $TILE_HEIGHT = 16;

  $hex = '000000';
  if (isset($_GET['hex'])) {
    $hex = $_GET['hex'];
  }

 ?><svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="<?php echo $TILE_WIDTH ?>" height="<?php echo $TILE_HEIGHT ?>">
  <ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill="#<?php echo $hex ?>"></ellipse>
</svg>
