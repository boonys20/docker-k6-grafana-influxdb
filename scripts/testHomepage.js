import http from 'k6/http';
import { check, sleep, group } from 'k6';

let constant = open('./constant.json');
constant = JSON.parse(constant);

export const options = {
    stages: [
      { duration: '1m',  target: 1000 }, // simulate ramp-up of traffic from 1 to 100 users over 5 minutes.
      { duration: '60m', target: 100 }, // stay at 100 users for 10 minutes
      { duration: '60m', target: 0 },   // ramp-down to 0 users
    ],
    thresholds: {
      http_req_failed: ['rate<0.01'], // http errors should be less than 1%
      http_req_duration: ['p(90) < 400', 'p(95) < 800', 'p(99.9) < 1000'], // 95% of requests should be below 200ms
    },
};

export default function () {
    const graphqlUrl = `${constant.baseURL}/graphql`;
    group(`API: ${graphqlUrl} => get product`, () => {
        const params = {
            headers: {
                'Content-Type': 'application/json',
                // Authorization: `Bearer ${dataInit.accessToken.token}`
            }
        };
        const payload = {
            query: `query { 
                      featuredProducts { 
                        isSuccess 
                        result {
                          products { 
                            id
                            name
                            previewPublicUrl
                            previewPublicCoverUrl
                            description
                            createdByUserID
                            createdByUserName
                            creatorAvatarURL
                            ownerID
                            ownerName
                            ownerAvatarURL
                            status
                            createdAt
                            offeringPrice {
                              sellingPrice
                              expectedRevenue
                              mintFee
                              platformFee
                              mdr
                            }
                            orderID
                            currency
                            campaignInfo {
                              name
                              type
                            }
                            purchaseDisabled
                          }
                        }
                        errors
                        { 
                          code
                        } 
                      } 
                    }`
        };
        const res = http.post(graphqlUrl, JSON.stringify(payload), params);

        check(res, {
            'status was 200': (r) => r.status == 200
        });

        check(JSON.parse(res.body), {
            'should have isSuccess': (body) => body.data.featuredProducts.hasOwnProperty('isSuccess'),
            'should return isSuccess = true': (body) => body.data.featuredProducts.isSuccess == true
        });
    });
    sleep(3);

    group(`API: ${graphqlUrl} => get artist`, () => {
        const params = {
            headers: {
                'Content-Type': 'application/json',
                // Authorization: `Bearer ${dataInit.accessToken.token}`
            }
        };
        const payload = {
            query: `query { 
        featuredArtists { 
          isSuccess 
          profiles {
            id
            profileName
          }
          errors
          { 
            code
          } 
        } 
      }`
        };
        const res = http.post(graphqlUrl, JSON.stringify(payload), params);

        check(res, {
            'status was 200': (r) => r.status == 200
        });

        check(JSON.parse(res.body), {
            'should have isSuccess': (body) => body.data.featuredArtists.hasOwnProperty('isSuccess'),
            'should return isSuccess = true': (body) => body.data.featuredArtists.isSuccess == true
        });
    });
    sleep(3)
}
