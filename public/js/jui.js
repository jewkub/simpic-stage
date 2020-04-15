$('#loading').hide();

      let canvas;
      var w;
      let db;
      let pic;
      let basic;
      var zv;
      let now = {};

      function dlCanvas() {
        var dt;
        function A(){
        //   var sc = (1.0/canvas.backgroundImage.scaleX);
        //   if(sc > 1.5) sc = 1.5
        //   dt = canvas.toDataURL({format: 'image/jpeg', multiplier: 1.5});
            
            var dt = canvas.toDataURL('jpeg');
            this.href = dt;
        //   cb();
        }
        function B(){
        //   dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
        //   dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=mahidolday.jpg');
        //   console.log(dt);
        //   this.href = dt;
          
        }
        // A();
        var dt = canvas.toDataURL({format: 'jpeg', multiplier: (1.0/canvas.backgroundImage.scaleX)});
        this.href = dt;
        // var dt = canvas.toDataURL('image/jpeg');
        // this.href = dt;
        $('#doneModal').modal({
          backdrop: 'static',
        });
      };
      function openImage(){
        var d;
        function DD(cb){
          var sc = 1.0/canvas.backgroundImage.scaleX;
          if(sc > 1.5) sc = 1.5
          d = canvas.toDataURL({format: 'jpeg', multiplier: (sc)});
          cb();
        }
        
        function SS(){
          try {
            w.close();
          }
          catch(e){
            ;
          }
          w=window.open('','Mahidol Day Profile');
          
          w.document.write("<img src='"+d+"' alt='MahidolDay'/>");
          $('#doneModal').modal({
            backdrop: 'static',
          });
          
          }
        DD(SS);
      }
    document.getElementById("dlpic").addEventListener('click', dlCanvas, false);
    document.getElementById("openpic").addEventListener('click', openImage, false);
    $("#reload").click(()=>{
      try {
        w.close();
      } catch(e)
      {
        ;
      }
      location.reload(true);
    });

    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      $('#dlpic').hide();
    } else {
      $('#openpic').hide();
    }

      function readURL(input) {
        return new Promise((rs, rj) => {
          let reader = new FileReader();
          reader.readAsDataURL(input);
          reader.onload = e => {
            rs(e.target.result);
          };
          reader.onerror = function(){
            rj(this);
          }
        });
      };
      function fromURL(url){
        return new Promise((rs, rj) => {
          fabric.Image.fromURL(url, oImg => {
            rs(oImg);
          });
        });
      };
      function setBackgroundImage(img){
        return new Promise((rs, rj) => {
          console.log("H: "+img.get('height'));
          console.log("W: "+img.get('width'));
          let tmp = 450.0/img.get('height');
          img.scale(tmp);
          console.log("scale: "+img.get('scaleX'));
          
          canvas.setBackgroundImage(img, () => {
            canvas.renderAll();
            rs(img);
          });
        });
      };
      function insertImageP(url){
        return new Promise((rs, rj) => {
          fromURL(url, function(){}, {crossOrigin: 'anonymous'})
          .then(img => {
            now.pic = img;
            let tmp = 450.0/img.get('height');
            img.scale(tmp);
            img.set('selectable', false);
            img.set('evented', false);
            canvas.add(img);
            canvas.renderAll();
            rs(1);
            rj(0);
          });
        })
      }
      function insertImage(url){
        fromURL(url, function(){}, {crossOrigin: 'anonymous'})
        .then(img => {
          now.pic = img;
          let tmp = 450.0/img.get('height');
          img.scale(tmp);
          img.set('selectable', false);
          img.set('evented', false);
          canvas.add(img);
          canvas.renderAll();
        });
      }
      function insertLogo(url){
        fromURL(url)
        .then(img => {
          now.logo = img;
          img.set('width', 300);
          img.set('height', 169);
          img.set('hasControls', false);
          img.set('hasBorders', false);
          canvas.add(img);
          canvas.renderAll();
        });
      }

      

      $(() => {
        basic = $('#crop').croppie({
          enableOrientation: true,
          viewport: {
            width: 350,
            height: 350,
            type: 'square', // can also circle
          }
        });

        $("#tLeft").click(function(){
          $('#crop').croppie('rotate',-90);
        });
        $("#tRight").click(function(){
          $('#crop').croppie('rotate',90);
        });

        canvas = new fabric.Canvas('c', {
          allowTouchScrolling: true
        });
        canvas.on({
          'mouse:down': function(e) {
            if (e.target) {
              e.target.opacity = 0.5;
              canvas.renderAll();
            }
          },
          'mouse:up': function(e) {
            if (e.target) {
              e.target.opacity = 1;
              canvas.renderAll();
            }
          },
          'object:moved': function(e) {
            e.target.opacity = 0.5;
          },
          'object:modified': function(e) {
            e.target.opacity = 1;
          }
        });


        $('#uploadModal').modal({
          backdrop: 'static',
          keyboard: false,
        });
        $('#uploadForm').submit(event => {
          let x = $('#uploadInput')['0'].files['0'];
          if(!x) return false;
          readURL(x)
          .then(val => {
            $('#uploadModal').modal('hide');
            return basic.croppie('bind', {
              url: val,
            });
          });

          canvas.clear();

          event.preventDefault();
        });


        $('#cropButton').click(event => {
          basic.croppie('result', {
            'size': 'original'
          })
          .then(fromURL)
          .then(setBackgroundImage)
          .then(img => {
            db = img;
            $('#cropRow').hide();
            $('#loading').show();
            insertImageP('./border.png').then(function(){
              return insertImageP('./border2.png');
            }).then(function(){
              $('#row').show();
              $('#loading').hide();
              canvas.item(1).set('visible', false);
              canvas.renderAll();
            });
          });
        });
        
        $('#sizeInput').on('input', event => {
          console.log($('#sizeInput').val());
        });

        $('#st1').click(function(){
          canvas.item(1).set('visible', false);
          canvas.item(0).set('visible', true);
          canvas.renderAll();
        });
        $('#st2').click(function(){
          canvas.item(0).set('visible', false);
          canvas.item(1).set('visible', true);
          canvas.renderAll();
        });

      });