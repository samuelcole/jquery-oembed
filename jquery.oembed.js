/* Forked from http://code.google.com/p/jquery-oembed/
 * Likely created by Richard Chamorro under the MIT license.
 * Tweaked up by Samuel Cole.
 */
(function ($) {
  function OEmbedProvider(name, urlPattern, oEmbedUrl, callbackparameter, format) {
    this.name = name;
    this.urlPattern = urlPattern;
    this.oEmbedUrl = oEmbedUrl ? oEmbedUrl : "http://oohembed.com/oohembed/";
    this.callbackparameter = callbackparameter ? callbackparameter : "callback";
    this.format = format ? format : 'json';
    this.maxWidth = 500;
    this.maxHeight = 400;

    this.matches = function (externalUrl) {
      // TODO: Convert to Regex
      return externalUrl.indexOf(this.urlPattern) >= 0;
    };

    this.getRequestUrl = function (externalUrl) {
      var url = this.oEmbedUrl, qs, i;

      if (url.indexOf("?") <= 0) {
        url = url + "?";
      } else {
        url = url + "&";
      }

      qs = "";

      if (this.maxWidth && !this.params.maxwidth) {
        this.params.maxwidth = this.maxWidth;
      }

      if (this.maxHeight && !this.params.maxheight) {
        this.params.maxheight = this.maxHeight;
      }

      for (i in this.params) {
        /*jslint continue: true */
        // We don't want them to jack everything up by changing the callback parameter
        if (i === this.callbackparameter) {
          continue;
        }

        // allows the options to be set to null, don't send null values to the server as parameters
        if (this.params[i]) {
          qs += "&" + encodeURIComponent(i) + "=" + this.params[i];
        }
      }

      url += "format=" + this.format + "&url=" + encodeURIComponent(externalUrl) +
        qs +
        "&" + this.callbackparameter + "=?";

      return url;
    };

    this.embedCode = function (container, externalUrl, callback) {
      var request = this.getRequestUrl(externalUrl);

      $.ajax({
        url: request,
        dataType: 'json',
        success: function (data) {
          var oembed = $.extend({}, data), 
            code,
            type = data.type;

          switch (type) {

          case "photo":
            oembed.code = $.fn.oembed.getPhotoCode(externalUrl, data);
            break;
          case "video":
            oembed.code = $.fn.oembed.getVideoCode(externalUrl, data);
            break;
          case "rich":
            oembed.code = $.fn.oembed.getRichCode(externalUrl, data);
            break;
          default:
            oembed.code = $.fn.oembed.getGenericCode(externalUrl, data);
            break;

          }

          callback(container, oembed);
        },
        error: function () {
          callback(container, null);
        }
      });
    };
  }
  var providers = [
    new OEmbedProvider("fivemin", "5min.com"),
    new OEmbedProvider("amazon", "amazon.com"),
    new OEmbedProvider("flickr", "flickr", "http://flickr.com/services/oembed", "jsoncallback"),
    new OEmbedProvider("googlevideo", "video.google."),
    new OEmbedProvider("hulu", "hulu.com"),
    new OEmbedProvider("imdb", "imdb.com"),
    new OEmbedProvider("metacafe", "metacafe.com"),
    new OEmbedProvider("qik", "qik.com"),
    new OEmbedProvider("revision3", "revision3.com"),
    new OEmbedProvider("slideshare", "slideshare.net"),
    new OEmbedProvider("twitpic", "twitpic.com"),
    new OEmbedProvider("viddler", "viddler.com"),
    new OEmbedProvider("vimeo", "vimeo.com", "http://vimeo.com/api/oembed.json"),
    new OEmbedProvider("wikipedia", "wikipedia.org"),
    new OEmbedProvider("wordpress", "wordpress.com"),
    new OEmbedProvider("youtube", "youtube.com"),
    new OEmbedProvider("vids.myspace.com", "vids.myspace.com", "http://vids.myspace.com/index.cfm?fuseaction=oembed"),
    new OEmbedProvider("screenr", "screenr.com", "http://screenr.com/api/oembed.json"),
    new OEmbedProvider("soundcloud", "soundcloud.com", "http://soundcloud.com/oembed", false, 'js')
  ];

  /* Private Methods */
  function getOEmbedProvider(url) {
    var i;
    for (i = 0; i < providers.length; i += 1) {
      if (providers[i].matches(url)) {
        return providers[i];
      }
    }
    return null;
  }

  function getNormalizedParams(params) {
    if (params === null) {
      return null;
    }
    var normalizedParams = {}, key;
    for (key in params) {
      if (key !== null) {
        normalizedParams[key.toLowerCase()] = params[key];
      }
    }
    return normalizedParams;
  }

  $.fn.oembed = function (url, options, callback) {
    options = $.extend(true, $.fn.oembed.defaults, options);

    return this.each(function () {

      var container = $(this),
        resourceURL = (url !== null) ? url : container.attr("href"),
        provider,
        allowed;

      if (!callback) {
        callback = function (container, oembed) {
          $.fn.oembed.insertCode(container, options.embedMethod, oembed);
        };
      }

      if (resourceURL !== null) {
        provider = getOEmbedProvider(resourceURL);

        if (provider !== null) {
          if (options.allowed_providers.length) {
            allowed = false;
            $.each(options.allowed_providers, function () {
              if (provider.name === this) {
                allowed = true;
                return false; //break
              }
            });
            if (!allowed) {
              callback(container, null);
              return;
            }
          }
          provider.params = getNormalizedParams(options[provider.name]) || {};
          provider.maxWidth = options.maxWidth;
          provider.maxHeight = options.maxHeight;
          provider.embedCode(container, resourceURL, callback);
          return;
        }
      }

      callback(container, null);
    });
  };

  // Plugin defaults
  $.fn.oembed.defaults = {
    maxWidth: null,
    maxHeight: null,
    allowed_providers: [],
    embedMethod: "replace" // "auto", "append", "fill"
  };

  $.fn.oembed.insertCode = function (container, embedMethod, oembed) {
    if (oembed === null) {
      return;
    }
    switch (embedMethod) {

    case "auto":
      if (container.attr("href") !== null) {
        $.fn.oembed.insertCode(container, "append", oembed);
      } else {
        $.fn.oembed.insertCode(container, "replace", oembed);
      }
      break;
    case "replace":
      container.replaceWith(oembed.code);
      break;
    case "fill":
      container.html(oembed.code);
      break;
    case "append":
      var oembedContainer = container.next();
      if (oembedContainer === null || !oembedContainer.hasClass("oembed-container")) {
        oembedContainer = container.after('<div class="oembed-container"></div>').next(".oembed-container");
        if (oembed !== null && oembed.provider_name !== null) {
          oembedContainer.toggleClass("oembed-container-" + oembed.provider_name);
        }
      }
      oembedContainer.html(oembed.code);
      break;
    default:
      break;

    }
  };

  $.fn.oembed.getPhotoCode = function (url, data) {
    var alt = data.title ? data.title : '',
      code;
    alt += data.author_name ? ' - ' + data.author_name : '';
    alt += data.provider_name ? ' - ' + data.provider_name : '';
    code = '<div><a href="' + url + '" target="_blank"><img src="' + data.url + '" alt="' + alt + '"/></a></div>';
    if (data.html) {
      code += "<div>" + data.html + "</div>";
    }
    return code;
  };

  $.fn.oembed.getVideoCode = function (url, data) {
    var code = data.html;
    return code;
  };

  $.fn.oembed.getRichCode = function (url, data) {
    var code = data.html;
    return code;
  };

  $.fn.oembed.getGenericCode = function (url, data) {
    var title = (data.title !== null) ? data.title : url,
      code = '<a href="' + url + '">' + title + '</a>';
    if (data.html) {
      code += "<div>" + data.html + "</div>";
    }
    return code;
  };

  $.fn.oembed.isAvailable = function (url) {
    var provider = getOEmbedProvider(url);
    return (provider !== null);
  };




}(jQuery));
