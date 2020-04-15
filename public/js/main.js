      $('.container').hide();
      $('#loading').hide();

      let canvas;
      let db;
      let pic;
      let basic;
      var zv;
      let now = {};

      // ---- Old download ----
      // var button = document.getElementById('dlpic');
      // button.addEventListener('click', function (e) {
      //     var dataURL = canvas.toDataURL({format: 'image/jpeg', multiplier: (1.0/canvas.backgroundImage.scaleX)});
      //     button.href = dataURL;
      // });

      function dlCanvas() {
        var dt;
        function A(cb){
          dt = canvas.toDataURL({format: 'image/jpeg', multiplier: (1.0/canvas.backgroundImage.scaleX)});
          cb();
        }
        function B(){

          dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
          dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=mahidolday.jpg');

          this.href = dt;
        }
        A(B);
      };
      function openImage(){
        var d;
        function DD(cb){
          var sc = 1.0/canvas.backgroundImage.scaleX;
          if(sc > 1.5) sc = 1.5
          d = canvas.toDataURL({format: 'image/jpeg', multiplier: (sc)});
          cb();
        }
        
        function SS(){
          var w=window.open('about:blank','Mahidol Day Profile');
          w.document.write("<img src='"+d+"' alt='MahidolDay'/>");
        }
        DD(SS);
      }
    document.getElementById("dlpic").addEventListener('click', dlCanvas, false);
    document.getElementById("openpic").addEventListener('click', openImage, false);

    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if( /iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
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
      function insertImage(url){
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
      function insertImageH(url){
        fromURL(url, function(){}, {crossOrigin: 'anonymous'})
        .then(img => {
          now.pic = img;
          let tmp = 450.0/img.get('height');
          img.scale(tmp);
          // img.set('width', 450);
          // img.set('height', 450);
          img.set('selectable', false);
          img.set('visible', false);
          img.set('evented', false);
          canvas.add(img);
          canvas.renderAll();
        });
      }
      function insertLogo(url){
        return new Promise((rs, rj) =>{
          fromURL(url)
          .then(img => {
            now.logo = img;
            img.set('width', 300);
            img.set('height', 169);
            img.set('hasControls', false);
            img.set('hasBorders', false);
            canvas.add(img);
            canvas.renderAll();
            rs(1);
            rj(0);
          });
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

        canvas = new fabric.Canvas('c');
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
          $('#loading').show();
          insertImage('./border.png').then(function(){
            return insertImage('./border2.png');
          }).then(function(){
            canvas.item(1).set('visible', false);
            $('.container').show();
            $('#loading').hide();
          });

          event.preventDefault();
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


        $('#cropButton').click(event => {
          basic.croppie('result', {
            'size': 'original'
          })
          .then(fromURL)
          .then(setBackgroundImage)
          .then(img => {
            db = img;
            $('#cropRow').hide();
            $('#row').show();
            // insertImage('./border.png');
          });
        });
        
        $('#sizeInput').on('input', event => {
          console.log($('#sizeInput').val());
        });



        // ----------- Add pic- --------------
        // $('#pic1').click(() => {
        //   if(!$('#pic1').hasClass('active')){
        //     if(now.$btn) now.$btn.trigger('click');
        //     now.$btn = $('#pic1');
        //     insertImage('./ananday1.png');
        //   }
        //   else {
        //     canvas.remove(now.pic);
        //     delete now.$btn;
        //   }
        // });
        // $('#pic2').click(() => {
        //   if(!$('#pic2').hasClass('active')){
        //     if(now.$btn) now.$btn.trigger('click');
        //     now.$btn = $('#pic2');
        //     insertImage('https://anandayphoto.docchula.com/assets/frames/2.png');
        //   }
        //   else {
        //     canvas.remove(now.pic);
        //     delete now.$btn;
        //   }
        // });

        //----- LOGO --------
        // $('#logo').click(() => {
        //   if(!$('#logo').hasClass('active')){
        //     now.$logo = $('#logo');
        //     insertLogo('http://www.freeiconspng.com/uploads/photos-facebook-logo-png-transparent-background-13.png');
        //   }
        //   else {
        //     canvas.remove(now.logo);
        //     delete now.$logo;
        //   }
        // });

      });